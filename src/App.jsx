import { useState } from "react";
import { COURSE } from "./config/courseData";
import QueryInput from "./components/QueryInput";
import AnswerCard from "./components/AnswerCard";
import { askGPTutor } from "./api/queryEngine";
import { transformAnswer } from "./utils/transformAnswer";
import thinkpalLogo from "./assets/Logo.png";

function App() {
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (query) => {
    try {
      setLoading(true);
      const response = await askGPTutor(query);
      const responseData = response.data;
      const tooltipsMetadata = response.tooltips_metadata || {};
      
      console.log("📝 Raw answer string:", responseData.answer);
      console.log("📝 Tooltips metadata:", tooltipsMetadata);
      
      const finalData = transformAnswer(responseData.answer, tooltipsMetadata);
      console.log("🧠 Transformed Answer:", finalData);
      setAnswer({ ...finalData });
    } catch (error) {
      console.error("❌ Backend error:", error);
      alert("Error fetching response. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-bg">
      <nav className="navbar">
        <div className="navbar-content header-row">
          <img src={thinkpalLogo} alt="ThinkPal Logo" className="navbar-logo header-logo" />
          <span className="header-title">Decision Coach</span>
        </div>
      </nav>
      <div className="main-container">
        <h1 className="text-2xl font-bold mb-4" style={{textAlign: 'center'}}>{COURSE.name}</h1>
        <div className="heading-padding" />
        <QueryInput onSubmit={handleQuery} />
        {loading && <p style={{textAlign: 'center', marginTop: '2rem'}}>🔄 Thinking...</p>}
        {answer && <div className="answers-wrapper"><AnswerCard {...answer} key={JSON.stringify(answer)} /></div>}
      </div>
    </div>
  );
}

export default App;
