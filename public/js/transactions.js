document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("transaction-form");
    const list = document.getElementById("transaction-list");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const formData = new FormData(form);
      const body = {
        description: formData.get("description"),
        amount: parseFloat(formData.get("amount")),
        type: formData.get("type"),
        date: formData.get("date")
      };
  
      try {
        const res = await fetch("/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
  
        if (res.ok) {
          window.location.reload();
        } else {
          alert("Failed to add transaction");
        }
      } catch (err) {
        console.error("Error adding transaction:", err);
      }
    });
  
    list.addEventListener("click", async (e) => {
      if (e.target.classList.contains("delete-btn")) {
        const id = e.target.dataset.id;
  
        try {
          const res = await fetch(`/transactions/${id}`, {
            method: "DELETE"
          });
  
          if (res.ok) {
            window.location.reload();
          } else {
            alert("Failed to delete transaction");
          }
        } catch (err) {
          console.error("Error deleting transaction:", err);
        }
      }
    });
  });
  