const cron = require('node-cron');

const allJobs = {}

function dateToCron(date) {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;
    const dayOfWeek = date.getDay();

    return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}

function createJob(customerId, ownerId, date) {

    cronDate = dateToCron(date);
    jobs[customerId] = cron.schedule(cronDate, remindSubscription(customerId, ownerId));
}

function removeJob(customerId) {
    if (jobs[customerId]) {
        jobs[customerId].stop();
        delete jobs[customerId];
    } else {
        console.log(`Job with ID ${id} does not exist.`);
    }
}

function remindSubscription(customerId, ownerId) {
    return "Reminded";
}