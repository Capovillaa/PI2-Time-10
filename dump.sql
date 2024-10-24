DROP TABLE BETS;
DROP TABLE EVENTS;
DROP TABLE CREDIT_CARD;
DROP TABLE ACCOUNTS;
DROP TABLE WALLETS;
DROP TABLE ADMIN_ACCOUNTS;
DROP SEQUENCE SEQ_ACCOUNTSPK;
DROP SEQUENCE SEQ_ACCOUNTSFK;
DROP SEQUENCE SEQ_WALLETSPK;
DROP SEQUENCE SEQ_WALLETSFK;
DROP SEQUENCE SEQ_BETSPK;
DROP SEQUENCE SEQ_EVENTSPK;
DROP SEQUENCE SEQ_EVENTSFK;

CREATE TABLE ADMIN_ACCOUNTS (
    id_adm NUMBER PRIMARY KEY,
    email VARCHAR2(255),
    senha VARCHAR2(255)
);

CREATE TABLE ACCOUNTS (
    id_usr NUMBER PRIMARY KEY,
    nome VARCHAR2(255),
    email VARCHAR2(255),
    senha VARCHAR2(255),
    data_nasc VARCHAR2(10),
    token VARCHAR2(255),
    fk_id_crt NUMBER
);

CREATE TABLE WALLETS (
    id_crt NUMBER PRIMARY KEY,
    saldo NUMBER
);

CREATE TABLE CREDIT_CARD (
    num_card NUMBER PRIMARY KEY,
    cvv NUMBER,
    validade VARCHAR2(7),
    fk_id_crt NUMBER
);

CREATE TABLE EVENTS (
    id_evt NUMBER PRIMARY KEY,
    fk_id_usr NUMBER,
    titulo VARCHAR2(255),
    descricao VARCHAR2(1000),
    data_inicio VARCHAR2(10),
    data_fim VARCHAR2(10),
    data_evt VARCHAR2(10),
    valor_cota NUMBER
);

CREATE TABLE BETS (
    id_apt NUMBER PRIMARY KEY,
    qtd_cotas NUMBER,
    fk_id_evt NUMBER,
    fk_id_usr NUMBER,
    escolha VARCHAR2(255)
);

ALTER TABLE ACCOUNTS ADD CONSTRAINT FK_USUARIO_CARTEIRA
    FOREIGN KEY (fk_id_crt)
    REFERENCES WALLETS (id_crt);

ALTER TABLE CREDIT_CARD ADD CONSTRAINT FK_CARTAO_CARTEIRA
    FOREIGN KEY (fk_id_crt)
    REFERENCES WALLETS (id_crt);

ALTER TABLE BETS ADD CONSTRAINT FK_APOSTAS_EVENTO
    FOREIGN KEY (fk_id_evt)
    REFERENCES EVENTS (id_evt);

ALTER TABLE BETS ADD CONSTRAINT FK_APOSTAS_USUARIO
    FOREIGN KEY (fk_id_usr)
    REFERENCES ACCOUNTS (id_usr);
    
ALTER TABLE EVENTS ADD CONSTRAINT FK_USUARIO_EVENTO
    FOREIGN KEY (fk_id_usr)
    REFERENCES ACCOUNTS (id_usr);
    
CREATE SEQUENCE SEQ_ACCOUNTSPK START WITH 1
INCREMENT BY 1;
CREATE SEQUENCE SEQ_ACCOUNTSFK START WITH 1
INCREMENT BY 1;
CREATE SEQUENCE SEQ_WALLETSPK START WITH 1
INCREMENT BY 1;
CREATE SEQUENCE SEQ_WALLETSFK START WITH 1
INCREMENT BY 1;
CREATE SEQUENCE SEQ_BETSPK START WITH 1
INCREMENT BY 1;
CREATE SEQUENCE SEQ_EVENTSPK START WITH 1
INCREMENT BY 1;
CREATE SEQUENCE SEQ_EVENTSFK START WITH 1
INCREMENT BY 1;
COMMIT;
