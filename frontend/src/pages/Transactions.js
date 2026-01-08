import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTransactions } from "../api";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn");
    if (!loggedIn) {
      navigate("/login");
      return;
    }

    getTransactions()
      .then(setTransactions)
      .catch(console.error);
  }, [navigate]);

  return (
    <div style={{ padding: 30 }}>
      <h2>Transactions</h2>

      <table data-test-id="transactions-table" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>Order ID</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              data-test-id="transaction-row"
              data-payment-id={tx.id}
            >
              <td data-test-id="payment-id">{tx.id}</td>
              <td data-test-id="order-id">{tx.order_id}</td>
              <td data-test-id="amount">{tx.amount}</td>
              <td data-test-id="method">{tx.method}</td>
              <td data-test-id="status">{tx.status}</td>
              <td data-test-id="created-at">
                {new Date(tx.created_at)
                  .toISOString()
                  .replace("T", " ")
                  .slice(0, 19)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
