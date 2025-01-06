var express = require('express');
var router = express.Router();

var funds = {
    total: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    categoryDistribution: {
        food: 0,
        clothing: 0,
        entertainment: 0,
        others: 0
    }
};

router.post('/charge', function (req, res) {
    const { amount, category } = req.body;

    if (!Number.isInteger(parseInt(amount))) {
        return res.status(400).json({ error: '輸入須為正負整數' });
    }
    if (!funds.categoryDistribution.hasOwnProperty(category)) {
        return res.status(400).json({ error: '請輸入正確的項目' });
    }

    const numericAmount = parseInt(amount);
    if (numericAmount > 0) {
        funds.monthlyIncome += numericAmount;
    } else {
        funds.monthlyExpense += numericAmount;
    }
    funds.total += numericAmount;
    funds.categoryDistribution[category] += numericAmount;

    res.json({
        total: funds.total,
        monthlyIncome: funds.monthlyIncome,
        monthlyExpense: funds.monthlyExpense,
        categoryDistribution: funds.categoryDistribution
    });
});

module.exports = router;
