
document.addEventListener("DOMContentLoaded", async () => {
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
  
      let income = 0;
      let expense = 0;
  
      data.forEach(tx => {
        if (tx.type === "income") income += tx.amount;
        else expense += tx.amount;
      });
  
      document.getElementById("income-total").textContent = income;
      document.getElementById("expense-total").textContent = expense;
      document.getElementById("savings-total").textContent = income - expense;
  
      const ctx = document.getElementById("financeChart").getContext("2d");
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Income', 'Expenses'],
          datasets: [{
            data: [income, expense],
            backgroundColor: ['#4caf50', '#f44336']
          }]
        }
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  });
  