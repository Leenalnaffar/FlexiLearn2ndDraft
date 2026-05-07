import { Router, type IRouter } from "express";
import healthRouter from "./health";
import learnerRouter from "./learner";
import pathsRouter from "./paths";
import skillsRouter from "./skills";
import lessonsRouter from "./lessons";
import progressRouter from "./progress";
import agentsRouter from "./agents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(learnerRouter);
router.use(pathsRouter);
router.use(skillsRouter);
router.use(lessonsRouter);
router.use(progressRouter);
router.use(agentsRouter);

export default router;
