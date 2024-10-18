DROP TABLE ACCOUNTS;
DROP SEQUENCE SEQ_ACCOUNTS;

CREATE TABLE ACCOUNTS(
    ID INTEGER NOT NULL PRIMARY KEY,
    EMAIL VARCHAR2(500) NOT NULL UNIQUE,
    PASSWORD VARCHAR2(64) NOT NULL,
    COMPLETE_NAME VARCHAR2(500) NOT NULL,
    TOKEN VARCHAR2(32) NOT NULL
);

CREATE SEQUENCE SEQ_ACCOUNTS START WITH 1
INCREMENT BY 1;
COMMIT;