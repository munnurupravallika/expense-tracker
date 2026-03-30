import React, { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { FaTrash, FaMoneyBillWave } from "react-icons/fa";
import "./App.css";

function App() {
  // Auth states
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Expense states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food");
  const [transactions, setTransactions] = useState([]);

  // Auto login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchTransactions();
  }, [isAuthenticated]);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/transactions");
      setTransactions(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Signup
  const handleSignup = async () => {
    try {
      const res = await axios.post("http://localhost:5000/signup", {
        name,
        email,
        password,
      });

      alert(res.data.message);
      if (res.data.message === "Signup successful") {
        setIsLogin(true);
        setName("");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Login
  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });

      alert(res.data.message);

      if (res.data.message === "Login successful") {
        localStorage.setItem("token", res.data.token);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log(error);
      alert("Login failed");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  // Add
  const addTransaction = async () => {
    if (!title || !amount || !date) return;

    await axios.post("http://localhost:5000/transactions", {
      title,
      amount: Number(amount),
      date,
      type,
      category,
    });

    fetchTransactions();
    setTitle("");
    setAmount("");
    setDate("");
  };

  // Delete
  const deleteTransaction = async (id) => {
    await axios.delete(`http://localhost:5000/transactions/${id}`);
    fetchTransactions();
  };

  // Clear all
  const clearAllTransactions = async () => {
    await axios.delete("http://localhost:5000/transactions");
    fetchTransactions();
  };

  // Calculations
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
        <>
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
          </select>

          <button onClick={addTransaction}>Add</button>

          {/* Transactions Section */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "20px",
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
                  <span
                    style={{
                      color: t.type === "income" ? "green" : "red",
                    }}
                  >
                    <FaMoneyBillWave
                      style={{ marginRight: "6px", fontSize: "14px" }}
                    />
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
        </>
      )}
    </div>
  );
}

export default App;