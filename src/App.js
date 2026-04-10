import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://expense-tracker-production-5606.up.railway.app";

  const [isLogin, setIsLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food");
  const [transactions, setTransactions] = useState([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchTransactions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const res = await axios.get(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTransactions(res.data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to load data ⚠️");
    }
  }, [API_URL]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
    }
  }, [isAuthenticated, fetchTransactions]);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      toast.error("Please fill all fields ⚠️");
      return;
    }

    try {
      await axios.post(`${API_URL}/signup`, {
        name,
        email,
        password,
      });

     toast.success("Signup successful 🎉");
      setName("");
      setEmail("");
      setPassword("");
      setIsLogin(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Signup failed ❌");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Fill all fields ❌");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setIsAuthenticated(true);
      toast.success("Signup successful 🎉");
      setEmail("");
      setPassword("");
    } catch (err) {
     toast.error(err?.response?.data?.message || "Signup failed ❌");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setTransactions([]);
    toast.success("Logged out");
  };

  const addTransaction = async () => {
    if (!title || !amount || !date) {
      toast.error("Fill all fields");
      return;
    }

    if (Number(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/transactions`,
        {
          title,
          amount: Number(amount),
          date,
          type,
          category,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Transaction added ✅");
      setTitle("");
      setAmount("");
      setDate("");
      setType("expense");
      setCategory("Food");
      fetchTransactions();
    } catch (err) {
      toast.error("Please fill all fields ⚠️");
      toast.error(err?.response?.data?.message || "Amount must be greater than 0 ❌");
      
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${API_URL}/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Deleted successfully 🗑️");
      fetchTransactions();
    } catch (err) {
      toast.error("Delete failed ❌");
    }
  };

  const clearAllTransactions = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("All transactions cleared 🧹");
      fetchTransactions();
    } catch (err) {
      toast.error("Clear failed ❌");
    }
  };

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((a, t) => a + Number(t.amount), 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((a, t) => a + Number(t.amount), 0);

  const balance = income - expense;

  const data = [
    { name: "Income", value: income },
    { name: "Expense", value: expense },
  ];

  const COLORS = ["#00C49F", "#FF4C4C"];

  const monthlyData = {};

  transactions.forEach((t) => {
    const month = new Date(t.date).toLocaleString("default", {
      month: "short",
    });

    if (!monthlyData[month]) {
      monthlyData[month] = { month, income: 0, expense: 0 };
    }

    if (t.type === "income") {
      monthlyData[month].income += Number(t.amount);
    } else {
      monthlyData[month].expense += Number(t.amount);
    }
  });

  const monthsOrder = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const chartData = Object.values(monthlyData).sort(
  (a, b) => monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month)
);const categoryData = transactions
  .filter((t) => t.type === "expense")
  .reduce((acc, t) => {
    const existing = acc.find((item) => item.name === t.category);

    if (existing) {
      existing.value += Number(t.amount);
    } else {
      acc.push({ name: t.category, value: Number(t.amount) });
    }

    return acc;
  }, []);


  return (
    <>
      <div className={`container ${darkMode ? "dark" : ""}`}>
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

            <p
              onClick={() => setIsLogin(!isLogin)}
              style={{ cursor: "pointer" }}
            >
              {isLogin ? "Signup instead" : "Login instead"}
            </p>
          </div>
          
        ) : (
          <div className="tracker-box">
            <h1>Expense Tracker</h1>

            <div className="user-info">
              <p className="user-name">Welcome, {user.name || "User"}</p>
              <p className="user-email">{user.email || ""}</p>
            </div>


            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
            <button
            className="dark-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Light Mode ☀️" : "Dark Mode 🌙"}
          </button>

           <h2 style={{ color: balance >= 0 ? "green" : "red" }}>
            Balance ₹{balance}
              </h2><div className="summary-cards">
                  <div className="summary-card income">Income: ₹{income}</div>
                  <div className="summary-card expense">Expense: ₹{expense}</div>
                    </div>

            <div className="dashboard">
              <div className="left">
                <div className="form-card">
                
            <h3>Add Transaction</h3>

            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Food">Food</option>
              <option value="Travel">Travel</option>
              <option value="Shopping">Shopping</option>
              <option value="Salary">Salary</option>
              <option value="Bills">Bills</option>
              <option value="Other">Other</option>
            </select>

            <button onClick={addTransaction}>Add</button>
          </div>
          
      <div className="chart-card small-chart">
          <h3>Monthly Analysis</h3>

          <BarChart width={300} height={200} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="income" fill="#00C49F" />
            <Bar dataKey="expense" fill="#FF4C4C" />
          </BarChart>
        </div>
          <div className="charts-row">

              <div>
                <h3>Income vs Expense</h3>
                <PieChart width={260} height={220}>
                  <Pie data={data} dataKey="value" outerRadius={75}>
                    {data.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>

              <div>
                <h3>Expense by Category</h3>
                {categoryData.length > 0 ? (
                  <PieChart width={260} height={220}>
                    <Pie data={categoryData} dataKey="value" outerRadius={75}>
                      {categoryData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={[
                            "#0088FE",
                            "#00C49F",
                            "#FFBB28",
                            "#FF8042",
                            "#AF19FF",
                            "#FF4C4C",
                          ][i % 6]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : (
                  <p>No expense category data</p>
                )}
              </div>
              </div>
              </div>
            
              <div className="right">
                <h2>Transactions</h2>

                 {transactions.length === 0 ? (
                    <p>No transactions yet</p>
                  ) : (
                 transactions.map((t) => (
                    <div className="transaction-item" key={t._id}>
                      <span
                        style={{
                          color: t.type === "income" ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {t.title} - ₹{t.amount} ({t.category})
                      </span>

                      <button
                        className="delete-btn"
                        onClick={() => deleteTransaction(t._id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))
                )}

                {transactions.length > 0 && (
                  <button onClick={clearAllTransactions}>Clear All</button>
                )}
                  
               </div>
                </div>
          </div>
        )}
      </div>
            

            <ToastContainer
              position="top-right"
              autoClose={2000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnHover
              theme="colored"
            />
          </>
        );
      }

export default App;