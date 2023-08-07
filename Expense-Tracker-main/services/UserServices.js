const getExpenses = (req) => {
    return  req.user.getExpenses();
}

module.exports = {
    getExpenses
}