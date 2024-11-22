export interface UserAccount{
    ID_USR:number;
    NOME:string;
    EMAIL:string;
    SENHA:string;
    DATA_NASC:string; 
    TOKEN:string;
    FK_ID_CRT:number;
};
export interface Wallet{
    ID_CRT:number;
    SALDO:number;
}
export interface Events{
    ID_EVT:number;
    FK_ID_USR:number;
    TITULO:string;
    DESCRICAO:string;
    CATEGORIA:string;
    DATA_INICIO:string;
    DATA_FIM:string;
    DATA_EVT:string;
    STATUS:string;
    VALOR_COTA:number;
}