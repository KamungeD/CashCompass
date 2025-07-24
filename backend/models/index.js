// Model exports
module.exports = {
  User: require('./User'),
  Transaction: require('./Transaction'),
  Category: require('./Category'),
  Budget: require('./Budget'),
  AnnualBudget: require('./AnnualBudget'), // Keep for backward compatibility
  MonthlyBudget: require('./MonthlyBudget'),
  YearlyPlan: require('./YearlyPlan')
};
