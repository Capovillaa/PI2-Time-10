import {Request, RequestHandler, Response} from "express";
import { UserAccount } from "../Interfaces/interface";
import OracleDB from "oracledb";
import dotenv from "dotenv";
import bcrypt from 'bcryptjs';

dotenv.config();

export namespace AccountsManager {

    function validateEmail(email: string) :boolean{
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function validatePassword(password: string) :boolean{
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&-])[A-Za-z\d@$!%*?&-]{8,}$/;
        const minlength = 8;
        if(password.length < minlength){
            return false;
        }
        return passwordRegex.test(password);
    }

    function validateBirthDate(birthDate: string): boolean{
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if(!dateRegex.test(birthDate)){
            return false;
        }

        const [year,month,day] = birthDate.split('-').map(Number);
        const birthDateObject = new Date(year,month - 1,day);

        if (birthDateObject.getFullYear() !== year || 
            birthDateObject.getMonth() !== month - 1 || 
            birthDateObject.getDate() !== day
        ) {
            return false;
        }

        const today = new Date();
        if(birthDateObject > today){
            return false;
        }

        const age = today.getFullYear() - birthDateObject.getFullYear()

        const isBeforeBirthdayThisYear = 
            today.getMonth() < birthDateObject.getMonth() ||
            (today.getMonth() === birthDateObject.getMonth() && today.getDate() < birthDateObject.getDate());

        const exactAge = isBeforeBirthdayThisYear? age - 1: age;

        return exactAge >= 18 && exactAge <= 100;
    }

    async function hashPassword(password: string) :Promise<string>{
        const hashedPassword = await bcrypt.hash(password,10);
        return hashedPassword;
    }

    async function signUp(nome:string, email:string, senha:string, dataNascimento:string) {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        let connection;

        try {
            connection = await OracleDB.getConnection({
                user: process.env.ORACLE_USER,
                password: process.env.ORACLE_PASSWORD,
                connectString: process.env.ORACLE_CONN_STR
            });

            let walletCreation = await connection.execute(
                `INSERT INTO WALLETS
                    (ID_CRT, SALDO)
                VALUES
                    (SEQ_WALLETSPK.NEXTVAL, 0)`,
                {},
                {autoCommit: false}
            );

            const hashedPassword = await hashPassword(senha);

            let insertion = await connection.execute(
                `INSERT INTO ACCOUNTS
                    (ID_USR,NOME,EMAIL,SENHA,DATA_NASC,TOKEN,FK_ID_CRT)
                VALUES
                    (SEQ_ACCOUNTSPK.NEXTVAL,:nome,:email,:hashedPassword,TO_DATE(:dataNascimento, 'YYYY-MM-DD'),dbms_random.string('x',32),SEQ_WALLETSFK.NEXTVAL)`,
                {nome,email,hashedPassword,dataNascimento},
                {autoCommit: false}
            );

            await connection.commit();
            console.log("Resultados da inserção: ", insertion);

        } catch (err) {
            console.error("Erro do banco de dados: ", err);
            throw new Error("Erro ao tentar criar a conta.");

        } finally {
            if (connection){
                try{
                    await connection.close();
                } catch (err) {
                    console.error("Erro ao tentar fechar a conexão: ", err);
                }
            }
        }

    }

    interface LoginResult {
        token?: string;
        error?: string;
    }

    async function loginAuthenticator(email: string, senha: string): Promise<LoginResult> {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        let connection;
    
        try {
            connection = await OracleDB.getConnection({
                user: process.env.ORACLE_USER,
                password: process.env.ORACLE_PASSWORD,
                connectString: process.env.ORACLE_CONN_STR,
            });
    
            let resultUser = await connection.execute<UserAccount>(
                `SELECT *
                 FROM ACCOUNTS
                 WHERE EMAIL = :email`,
                { email }
            );
    
            let User = resultUser.rows && resultUser.rows[0] ? resultUser.rows[0] : null;
    
            if (User) {
                const isPasswordValid = await bcrypt.compare(senha, User.SENHA);
    
                if (isPasswordValid) {
                    console.log(`Login bem sucedido. Bem-vindo(a), ${User.NOME}!`);
                    return { token: User.TOKEN };
                } else {
                    return { error: "Senha inválida!" };
                }
            }
            return { error: "Conta não encontrada!" };
        } catch (err) {
            console.error("Erro do banco de dados: ", err);
            throw new Error("Erro ao tentar realizar o login.");
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error("Erro ao tentar fechar a conexão: ", err);
                }
            }
        }
    }    

    export const signUpHandler: RequestHandler = async (req: Request, res: Response) => {
        const pNome = req.get('nome');
        const pEmail = req.get('email');
        const pSenha = req.get('senha');
        const pBirthDate = req.get('dataNascimento');

        if (pEmail && pSenha && pNome && pBirthDate){
            if(validateEmail(pEmail) && validatePassword(pSenha) && validateBirthDate(pBirthDate)){
                try {
                    await signUp(pNome, pEmail, pSenha, pBirthDate);
                    res.statusCode = 200;
                    res.send('Conta criada com sucesso.');
                } catch (error) {
                    res.statusCode = 500;
                    res.send('Erro ao tentar criar a conta. Tente novamente.')
                }
            } else {
                res.statusCode = 400;
                res.send('Parâmetros inválidos ou faltantes.')
            }
        } else {
            res.statusCode = 400;
            res.send('Parâmetros inválidos ou faltantes.');
        }
    }

    export const loginAuthenticatorHandler: RequestHandler = async (req: Request, res: Response) => {
        const pEmail = req.get("email");
        const pSenha = req.get("senha");
    
        if (pEmail && pSenha) {
            try {
                const resultLogin = await loginAuthenticator(pEmail, pSenha);
    
                if (resultLogin.error) {
                    res.status(401).send(resultLogin.error);
                } else if (resultLogin.token) {
                    res.status(200).json({ token: resultLogin.token });
                }
            } catch (error) {
                console.error("Erro durante o login:", error);
                res.status(500).send("Erro ao tentar localizar sua conta. Tente novamente.");
            }
        } else {
            res.status(400).send("Parâmetros inválidos ou faltantes.");
        }
    };    
}