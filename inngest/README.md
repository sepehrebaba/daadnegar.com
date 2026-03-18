# Inngest

We use a serverless function-based tool called `Inngest` for CronJobs and Queues.

## Define New Function

Inside the `/functions` directory, we have `/crons` for CronJobs and `/queues` for Queues. Inside each directory, you need to create a new file and define your function following the same structure of the previous ones. Then add it to the `index.ts` of each directory. That's it! your functions has now been added to the list.
