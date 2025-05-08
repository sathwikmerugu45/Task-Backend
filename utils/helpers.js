module.exports = {
    calculateTotals: (transactions) => {
      let totalIncome = 0;
      let totalExpense = 0;
      for (const t of transactions) {
        if (t.type === "income") totalIncome += t.amount;
        else totalExpense += t.amount;
      }
      return {
        totalIncome,
        totalExpense,
        totalSavings: totalIncome - totalExpense
      };
    }
  };
  