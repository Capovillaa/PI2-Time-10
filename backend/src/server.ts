import express from "express";
import { Request, Response, Router } from "express";
import cors from "cors";
import { AccountsManager } from "./accounts/accounts";
import { EventsManager } from "./events/events";
import { FinancialManager } from "./financial/financial";

const port = 3000;
const server = express();
const routes = Router();

server.use(cors());

routes.get('/', (req: Request, res: Response) => {
    res.statusCode = 403;
    res.send('Acesso não permitido. Rota default não disponivel.');
});

// Accounts
routes.put('/signUp', AccountsManager.signUpHandler);
routes.put('/login', AccountsManager.loginAuthenticatorHandler);

// Financial
routes.post('/addFunds', FinancialManager.addFundsHandler);
routes.post('/withdrawFunds', FinancialManager.withdrawFundsHandler);

// Events
routes.put('/addNewEvent', EventsManager.addNewEventHandler);
routes.post('/evaluateNewEvent', EventsManager.evaluateNewEventHandler);
routes.get('/getEvents', EventsManager.getEventsHandler);
routes.get('/searchEvents', EventsManager.searchEventsHandler);
routes.get('/getEventsQtty', EventsManager.getEventsQttyHandler);
routes.post('/getEventsByPage', EventsManager.getEventsByPageHandler);
routes.post('/deleteEvent', EventsManager.deleteEventsHandler);
routes.post('/betOnEvent', EventsManager.betOnEventsHandler);
routes.post('/finishEvent', EventsManager.finishEventHandler);

server.use(routes);

server.listen(port, () => {
    console.log(`Servidor rodando na porta: ${port}`);
});
