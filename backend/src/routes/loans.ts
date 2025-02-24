import express from 'express';
import { AppDataSource } from '../database';
import { Loan } from '../entities/Loan';

const router = express.Router();

router.get('/', async (_, res) => {
    try {
        const loans = await AppDataSource.manager.find(Loan);
        res.json(loans);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch loans" });
    }
});

router.get('/borrower/:address', async (req, res) => {
    try {
        const loans = await AppDataSource.manager.find(Loan, {
            where: { borrower: req.params.address }
        });
        res.json(loans);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch loans" });
    }
});

export default router; 