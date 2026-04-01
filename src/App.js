import React, { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { FaTrash, FaMoneyBillWave } from "react-icons/fa";
import "./App.css";

function App() {
  const API_URL =
    process.env.REACT_APP_API_URL || "https://your-railway-url.up.railway.app";

  const [isLogin, setIsLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    setIsAuthenticated(true);
  }
}, []);

const fetchTransactions = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.get(`${API_URL}/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setTransactions(res.data);
  } catch (error) {
    console.log("Fetch error:", error.response?.data || error.message);
    alert("Failed to fetch transactions");
  }
};

useEffect(() => {
  fetchTransactions();
  // eslint-disable-next-line
}, []);

  const handleSignup = async () => {
  if (!name || !email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await axios.post(
      `${API_URL}/signup`,
      {
        name,
        email,
        password,
      }
    );

    console.log("Signup response:", res.data);

    if (res.data.message === "Signup successful") {
      alert("Signup successful ✅");

      setIsLogin(true);   // go to login
      setName("");
      setEmail("");
      setPassword("");
    } else {
      alert(res.data.message); // show backend message
    }

  } catch (error) {
    console.log("Signup error:", error.response || error);

    alert(
      error.response?.data?.message ||
      "Signup failed ❌"
    );
  }
};

const handleLogin = async () => {
  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });

    alert(res.data.message);

    if (res.data.message === "Login successful") {
      localStorage.setItem("token", res.data.token);
      setIsAuthenticated(true);
      setEmail("");
      setPassword("");
    }
  } catch (error) {
    console.log("Login error:", error.response?.data || error.message);
    console.log("Login status:", error.response?.status);
    alert(error.response?.data?.message || "Login failed");
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setTransactions([]);
  };

 const addTransaction = async () => {
  if (!title || !amount || !date) {
    alert("Please fill all transaction fields");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const newData = {
      title,
      amount: Number(amount),
      date,
      type,
      category,
    };

    await axios.post(`${API_URL}/transactions`, newData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchTransactions();

    setTitle("");
    setAmount("");
    setDate("");
    setType("expense");
    setCategory("Food");
  } catch (error) {
    console.log("Add error:", error.response?.data || error.message);
    alert("Failed to add transaction");
  }
};

  const deleteTransaction = async (id) => {
    try {
       const token = localStorage.getItem("token");

await axios.delete(`${API_URL}/transactions/${id}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
      fetchTransactions();
    } catch (error) {
      console.log("Delete error:", error);
      alert("Failed to delete transaction");
    }
  };

 const clearAllTransactions = async () => {
  try {
    const token = localStorage.getItem("token");

    await axios.delete(`${API_URL}/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchTransactions();
  } catch (error) {
    console.log("Clear all error:", error);
    alert("Failed to clear transactions");
  }
};

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((a, t) => a + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((a, t) => a + t.amount, 0);

  const balance = income - expense;

  const data = [
    { name: "Income", value: income },
    { name: "Expense", value: expense },
  ];

  const COLORS = ["#00C49F", "#FF4C4C"];

  return (
    <div className="container">
      {!isAuthenticated ? (
        <div className="auth-box">
          <h1>{isLogin ? "Login" : "Signup"}</h1>

          {!isLogin && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={isLogin ? handleLogin : handleSignup}>
            {isLogin ? "Login" : "Signup"}
          </button>

          <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: "pointer" }}>
            {isLogin
              ? "Don't have account? Signup"
              : "Already have account? Login"}
          </p>
        </div>
      ) : (
        <div className="tracker-box">
          <h1>Expense Tracker</h1>
          <button onClick={handleLogout}>Logout</button>

          <h2>Balance: ₹{balance}</h2>
          <p>Income: ₹{income} | Expense: ₹{expense}</p>

          <PieChart width={300} height={300}>
            <Pie data={data} dataKey="value" outerRadius={100} label>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            type="number"
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Food</option>
            <option>Travel</option>
            <option>Shopping</option>
            <option>Salary</option>
            <option>Bills</option>
            <option>Other</option>
          </select>

          <button onClick={addTransaction}>Add</button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "20px",
              width: "100%",
              maxWidth: "500px",
            }}
          >
            <h2>Transactions</h2>
            <button onClick={clearAllTransactions}>Clear All</button>
          </div>

          {transactions.length === 0 ? (
            <p>No transactions found.</p>
          ) : (
            transactions.map((t) => (
              <div className="transaction-item" key={t._id}>
                <div>
                  <span style={{ color: t.type === "income" ? "green" : "red" }}>
                    <FaMoneyBillWave style={{ marginRight: "6px", fontSize: "14px" }} />
                    {t.title} - ₹{t.amount}
                  </span>
                  <br />
                  <small>
                    {t.type} | {t.category} | {t.date}
                  </small>
                </div>

                <button
                  onClick={() => deleteTransaction(t._id)}
                  className="delete-btn"
                >
                  <FaTrash style={{ fontSize: "12px" }} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;