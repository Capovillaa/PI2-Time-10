import {Request, RequestHandler, Response} from "express";
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
        const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
        return dateRegex.test(birthDate);
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
                    (SEQ_ACCOUNTSPK.NEXTVAL,:nome,:email,:hashedPassword,TO_DATE(:dataNascimento, 'DD-MM-YYYY'),dbms_random.string('x',32),SEQ_WALLETSFK.NEXTVAL)`,
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

    async function loginAuthenticator(email:string, senha:string): Promise<boolean> {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        let connection;

        try {
            connection = await OracleDB.getConnection({
                user: process.env.ORACLE_USER,
                password: process.env.ORACLE_PASSWORD,
                connectString: process.env.ORACLE_CONN_STR
            });

            interface AdminAccount {
                EMAIL: string;
                SENHA: string;
            }

            interface Account {
                NOME: string;
                EMAIL: string;
                SENHA: string;
            }

            let adminLogin = await connection.execute(
                `SELECT EMAIL, SENHA
                 FROM ADMIN_ACCOUNTS
                 WHERE EMAIL = :email`,
                 {email}
            )

            let verificacaoLogin:boolean = false;

            if (adminLogin.rows && adminLogin.rows.length > 0){
                const adminAccount = adminLogin.rows[0] as unknown as AdminAccount
                const senhaBanco = adminAccount.SENHA;

                if (senha === senhaBanco){
                    verificacaoLogin = true;
                    console.log('Login bem sucedido. Bem-vindo(a) ADMIN');
                }
            }

            let userLogin = await connection.execute(
                `SELECT NOME, EMAIL, SENHA
                 FROM ACCOUNTS
                 WHERE EMAIL = :email`,
                 {email}
            )

            if (userLogin.rows && userLogin.rows.length > 0){
                const account = userLogin.rows[0] as unknown as Account
                const senhaCriptografada = account.SENHA;
                const isPasswordValid = await bcrypt.compare(senha, senhaCriptografada); 

                if (isPasswordValid){
                    verificacaoLogin = true;
                    console.log(`Login bem sucedido. Bem-vindo(a), ${account.NOME}!`);
                }
            }
            
            return verificacaoLogin;

        } catch (err) {
            console.error("Erro do banco de dados: ", err);
            throw new Error("Erro ao tentar realizar o login.");

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
        const pEmail = req.get('email');
        const pSenha = req.get('senha');

        if (pEmail && pSenha){
            try {
                const resultLogin = await loginAuthenticator(pEmail, pSenha);
                
                if (resultLogin){
                    res.statusCode = 200;
                    res.send('Login realizado com sucesso.')
                } else {
                    res.statusCode = 401;
                    res.send('Senha incorreta ou usuário não encontrado.')
                }
            } catch (error) {
                res.statusCode = 500;
                res.send('Erro ao tentar localizar sua conta. Tente novamente.')
            }
        } else {
            res.statusCode = 400;
            res.send('Parâmetros inválidos ou faltantes.')
        }
    } 
}