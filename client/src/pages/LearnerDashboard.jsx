import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import NotificationBell from "../components/NotificationBell";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getGreeting } from "../utils/helpers";
import CourseDetailModal from "../components/CourseDetailModal";
import {
  getMyEnrollmentsAPI, getRecommendationsAPI, getAllCoursesAPI,
  enrollCourseAPI, updateProfileAPI, getActiveSessionsAPI,
  addReviewAPI, getCourseReviewsAPI,
} from "../api/api";

const CATS = ["All","Web Dev","AI / ML","Data Science","Design","Mobile Dev","DevOps","Blockchain","Freelancing","Marketing","Cybersecurity"];

const NAV = [
  { id:"dashboard",       label:"Dashboard",      icon:"🏠" },
  { id:"courses",         label:"Browse Courses", icon:"📚" },
  { id:"my-courses",      label:"My Courses",     icon:"🎯" },
  { id:"recommendations", label:"For You",        icon:"✨" },
  { id:"live",            label:"Live Sessions",  icon:"🔴" },
  { id:"sessions",        label:"Sessions",       icon:"📅" },
  { id:"chat",            label:"Messages",       icon:"💬" },
  { id:"feedback",        label:"Reviews",        icon:"⭐" },
  { id:"profile",         label:"Profile",        icon:"👤" },
];

export default function LearnerDashboard() {
  const [tab,         setTab]         = useState("dashboard");
  const [search,      setSearch]      = useState("");
  const [cat,         setCat]         = useState("All");
  const [enrollments, setEnrollments] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [allCourses,  setAllCourses]  = useState([]);
  const [activeSess,  setActiveSess]  = useState([]);
  const [loadingE,    setLoadingE]    = useState(true);
  const [loadingR,    setLoadingR]    = useState(true);
  const [loadingC,    setLoadingC]    = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [toast,       setToast]       = useState(null);
  const [profile,     setProfile]     = useState({ name:"", phone:"", bio:"", skills:"" });
  const [profBusy,    setProfBusy]    = useState(false);
  const [profErr,     setProfErr]     = useState("");
  const [reviewCourse,setReviewCourse]= useState(null);
  const [reviewForm,  setReviewForm]  = useState({ rating:5, comment:"" });
  const [reviewBusy,  setReviewBusy]  = useState(false);
  const [myReviews,   setMyReviews]   = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const { user }   = useAuth();
  const { socket } = useSocket() || {};

  useEffect(() => { document.title = `${NAV.find(n=>n.id===tab)?.label||"Dashboard"} — OpenGig`; }, [tab]);
  useEffect(() => { if(user) setProfile({ name:user.name||"", phone:user.phone||"", bio:user.bio||"", skills:Array.isArray(user.skills)?user.skills.join(", "):"" }); }, [user]);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const fetchE = useCallback(async () => {
    setLoadingE(true);
    try { const r = await getMyEnrollmentsAPI(); setEnrollments(Array.isArray(r.data)?r.data:[]); }
    catch {} finally { setLoadingE(false); }
  }, []);

  const fetchR = useCallback(async () => {
    setLoadingR(true);
    try { const r = await getRecommendationsAPI(); const d=r.data; setRecommended(Array.isArray(d)?d:Array.isArray(d?.recommendations)?d.recommendations:[]); }
    catch {} finally { setLoadingR(false); }
  }, []);

  const fetchC = useCallback(async () => {
    setLoadingC(true);
    try { const r = await getAllCoursesAPI(); setAllCourses(Array.isArray(r.data)?r.data:[]); }
    catch {} finally { setLoadingC(false); }
  }, []);

  const fetchSessions = useCallback(async () => {
    try { const r = await getActiveSessionsAPI(); setActiveSess(Array.isArray(r.data)?r.data:[]); }
    catch {}
  }, []);

  useEffect(() => {
    fetchE(); fetchR(); fetchC(); fetchSessions();
    const t = setInterval(fetchSessions, 15000);
    return () => clearInterval(t);
  }, [fetchE, fetchR, fetchC, fetchSessions]);

  // Real-time: listen for new live sessions
  useEffect(() => {
    if (!socket) return;
    const h = (notif) => {
      if (notif.type === "live_session") {
        fetchSessions();
        showToast(`🔴 ${notif.title} — Click Live Sessions to join!`);
      }
    };
    socket.on("notification:new", h);
    return () => socket.off("notification:new", h);
  }, [socket, fetchSessions]);

  const isEnrolled = id => enrollments.some(e=>(e.course?._id||e.course||e._id)?.toString()===id?.toString());
  const enrolledList = enrollments.map(e=>e.course||e).filter(Boolean);

  const filtered = allCourses.filter(c => {
    const q = search.toLowerCase();
    return (!q||c.title?.toLowerCase().includes(q)||c.description?.toLowerCase().includes(q)) &&
           (cat==="All"||c.category?.toLowerCase().includes(cat.toLowerCase()));
  });

 const handleEnroll = async id => {
  // Paid courses → open detail modal for payment
  const course = allCourses.find(c => c._id?.toString() === id?.toString());
  if (course?.price > 0) { setSelectedCourse(course); return; }

  if (enrollingId) return;
  setEnrollingId(id);
  try {
    const r = await enrollCourseAPI(id);
    if (r.data?.message?.toLowerCase().includes("already")) showToast("Already enrolled!", "warning");
    else { showToast("Enrolled! 🎉"); fetchE(); fetchR(); }
  } catch(e) { showToast(e?.response?.data?.message || "Failed.", "error"); }
  finally { setEnrollingId(null); }
};

  const handleProfile = async e => {
    e.preventDefault(); setProfErr(""); setProfBusy(true);
    try {
      const p = { name:profile.name, phone:profile.phone, bio:profile.bio, skills:profile.skills.split(",").map(s=>s.trim()).filter(Boolean) };
      await updateProfileAPI(p);
      localStorage.setItem("opengig_user", JSON.stringify({...user,...p}));
      showToast("Profile saved! ✅");
    } catch(e) { setProfErr(e?.response?.data?.message||"Failed."); }
    finally { setProfBusy(false); }
  };

  const handleReview = async courseId => {
    setReviewBusy(true);
    try {
      await addReviewAPI({ courseId, rating:reviewForm.rating, comment:reviewForm.comment });
      showToast("Review submitted! ⭐");
      setReviewCourse(null); setReviewForm({rating:5,comment:""});
      // refresh my reviews
      const results = await Promise.all(enrolledList.map(c=>getCourseReviewsAPI(c._id).catch(()=>({data:{reviews:[]}}))));
      setMyReviews(results.flatMap(r=>r.data?.reviews||[]).filter(rv=>(rv.user?._id||rv.user)?.toString()===user?._id?.toString()));
    } catch(e) { showToast(e?.response?.data?.message||"Failed.","error"); }
    finally { setReviewBusy(false); }
  };

  useEffect(() => {
    if (tab!=="feedback"||enrolledList.length===0) return;
    Promise.all(enrolledList.map(c=>getCourseReviewsAPI(c._id).catch(()=>({data:{reviews:[]}}))))
      .then(r=>setMyReviews(r.flatMap(x=>x.data?.reviews||[]).filter(rv=>(rv.user?._id||rv.user)?.toString()===user?._id?.toString())));
  }, [tab, enrolledList.length]);

  const stars = (n, interactive=false, onSet) => (
    <div style={{display:"flex",gap:2}}>
      {[1,2,3,4,5].map(i=>(
        <span key={i} onClick={()=>interactive&&onSet&&onSet(i)}
          style={{fontSize:interactive?24:14,cursor:interactive?"pointer":"default",color:i<=n?"#f59e0b":"#e5e7eb"}}>★</span>
      ))}
    </div>
  );

  const liveCount = activeSess.length;
  const navWithBadge = NAV.map(n => n.id==="live"&&liveCount>0 ? {...n,badge:liveCount} : n);

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#f9fafb",fontFamily:"ui-sans-serif,system-ui,sans-serif"}}>
      <Sidebar activeTab={tab} setActiveTab={setTab} navItems={navWithBadge} role="Learner"/>

      <main style={{marginLeft:220,flex:1,display:"flex",flexDirection:"column"}}>
        <header style={{background:"#fff",borderBottom:"1px solid #f3f4f6",padding:"12px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:30}}>
          <div>
            <h2 style={{fontSize:16,fontWeight:700,color:"#111827",margin:0}}>{getGreeting()}, {user?.name?.split(" ")[0]} 👋</h2>
            <p style={{fontSize:11,color:"#9ca3af",marginTop:2}}>
              Learner Dashboard
              {liveCount>0&&<span onClick={()=>setTab("live")} style={{marginLeft:8,background:"#fef2f2",color:"#dc2626",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,cursor:"pointer"}}>🔴 {liveCount} Live Now</span>}
            </p>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:10,top:8,fontSize:12}}>🔍</span>
              <input type="text" placeholder="Search courses..." value={search}
                onChange={e=>{setSearch(e.target.value);setTab("courses");}}
                style={{paddingLeft:30,paddingRight:12,paddingTop:7,paddingBottom:7,fontSize:12,border:"1px solid #e5e7eb",borderRadius:8,width:200,background:"#f9fafb",color:"#111827",outline:"none"}}/>
            </div>
            <NotificationBell/>
          </div>
        </header>

        {toast&&<div style={{position:"fixed",bottom:"2rem",right:"2rem",zIndex:9999,padding:"0.75rem 1.5rem",borderRadius:10,fontWeight:600,fontSize:14,background:toast.type==="error"?"#fef2f2":toast.type==="warning"?"#fffbeb":"#f0fdf4",color:toast.type==="error"?"#dc2626":toast.type==="warning"?"#d97706":"#16a34a",border:`1px solid ${toast.type==="error"?"#fca5a5":toast.type==="warning"?"#fcd34d":"#86efac"}`,boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}>{toast.msg}</div>}

        <div style={{padding:"24px 28px",flex:1}}>

          {/* DASHBOARD */}
          {tab==="dashboard"&&(
            <div style={{display:"flex",flexDirection:"column",gap:24}}>
              {liveCount>0&&(
                <div style={{background:"linear-gradient(135deg,#fef2f2,#fee2e2)",border:"2px solid #fca5a5",borderRadius:12,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <p style={{margin:0,fontWeight:700,color:"#dc2626",fontSize:14}}>🔴 Live Session in Progress!</p>
                    <p style={{margin:"4px 0 0",color:"#6b7280",fontSize:12}}>{activeSess[0].Mentor?.name} is live: "{activeSess[0].title}"</p>
                  </div>
                  <button onClick={()=>window.open(activeSess[0].zoomLink,"_blank","noopener,noreferrer")}
                    style={{background:"#dc2626",color:"#fff",border:"none",fontSize:13,fontWeight:700,padding:"9px 20px",borderRadius:8,cursor:"pointer"}}>Join Now →</button>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                {[["Enrolled",enrolledList.length,"📚","#0f766e"],["Recommendations",recommended.length,"✨","#ea580c"],["Live Now",liveCount,"🔴","#dc2626"],["Reviews",myReviews.length,"⭐","#f59e0b"]].map(([l,v,i,c])=>(
                  <div key={l} style={{background:"#fff",borderRadius:12,padding:"16px 18px",border:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:24}}>{i}</span>
                    <div><p style={{fontSize:22,fontWeight:800,color:c,margin:0}}>{v}</p><p style={{fontSize:12,color:"#6b7280",margin:0}}>{l}</p></div>
                  </div>
                ))}
              </div>
              <section>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <h3 style={{fontSize:15,fontWeight:700,color:"#111827",margin:0}}>Continue Learning</h3>
                  <button onClick={()=>setTab("my-courses")} style={{fontSize:12,color:"#0d9488",background:"transparent",border:"none",cursor:"pointer"}}>View all →</button>
                </div>
                {loadingE?<Spinner/>:enrolledList.length===0?<Empty icon="📚" title="No courses yet" desc="Browse and enroll!" btn="Browse" onBtn={()=>setTab("courses")}/>:(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                    {enrolledList.slice(0,3).map(c=><EnrolledCard key={c._id} course={c} onReview={()=>{setReviewCourse(c);setTab("feedback");}}/>)}
                  </div>
                )}
              </section>
              <section>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div>
                    <h3 style={{fontSize:15,fontWeight:700,color:"#111827",margin:0}}>AI Recommendations</h3>
                    <p style={{fontSize:11,color:"#9ca3af",marginTop:2}}>TF-IDF + Cosine Similarity</p>
                  </div>
                  <button onClick={()=>setTab("recommendations")} style={{fontSize:12,color:"#0d9488",background:"transparent",border:"none",cursor:"pointer"}}>See all →</button>
                </div>
                {loadingR?<Spinner/>:recommended.length===0?<Empty icon="✨" title="No recommendations yet" desc="Enroll in courses to get AI suggestions!"/>:(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
{recommended.slice(0,4).map(c=><CourseCard key={c._id} course={c} enrolled={isEnrolled(c._id)} enrolling={enrollingId===c._id} onEnroll={()=>handleEnroll(c._id)} onView={()=>setSelectedCourse(c)}/>)}                  </div>
                )}
              </section>
            </div>
          )}

          {/* BROWSE */}
          {tab==="courses"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <h2 style={{fontSize:18,fontWeight:700,color:"#111827",margin:0}}>Browse Courses</h2>
                <span style={{fontSize:12,color:"#9ca3af"}}>{filtered.length} found</span>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                {CATS.map(c=><button key={c} onClick={()=>setCat(c)} style={{fontSize:12,padding:"5px 14px",borderRadius:999,border:"1px solid #e5e7eb",cursor:"pointer",fontWeight:500,background:cat===c?"#0d9488":"#fff",color:cat===c?"#fff":"#374151"}}>{c}</button>)}
              </div>
              {loadingC?<Spinner/>:filtered.length===0?<Empty icon="🔍" title="No courses found" desc="Try different search or category" btn="Clear" onBtn={()=>{setSearch("");setCat("All");}}/>:(
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
{filtered.map(c=><CourseCard key={c._id} course={c} enrolled={isEnrolled(c._id)} enrolling={enrollingId===c._id} onEnroll={()=>handleEnroll(c._id)} onView={()=>setSelectedCourse(c)}/>)}                </div>
              )}
            </div>
          )}

          {/* MY COURSES */}
          {tab==="my-courses"&&(
            <div>
              <h2 style={{fontSize:18,fontWeight:700,color:"#111827",marginBottom:20}}>My Enrolled Courses</h2>
              {loadingE?<Spinner/>:enrolledList.length===0?<Empty icon="🎯" title="No enrollments" desc="Browse and enroll!" btn="Browse" onBtn={()=>setTab("courses")}/>:(
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                  {enrolledList.map(c=><EnrolledCard key={c._id} course={c} onReview={()=>{setReviewCourse(c);setTab("feedback");}}/>)}
                </div>
              )}
            </div>
          )}

          {/* RECOMMENDATIONS */}
          {tab==="recommendations"&&(
            <div>
              <h2 style={{fontSize:18,fontWeight:700,color:"#111827",marginBottom:4}}>AI Recommendations</h2>
              {/* <p style={{fontSize:13,color:"#9ca3af",marginBottom:20}}>Personalised using TF-IDF + Cosine Similarity on your enrolled courses</p> */}
              {loadingR?<Spinner/>:recommended.length===0?<Empty icon="✨" title="No recommendations yet" desc="Enroll in more courses to improve suggestions!"/>:(
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
{recommended.map(c=><CourseCard key={c._id} course={c} enrolled={isEnrolled(c._id)} enrolling={enrollingId===c._id} onEnroll={()=>handleEnroll(c._id)} onView={()=>setSelectedCourse(c)}/>)}                </div>
              )}
            </div>
          )}

          {/* LIVE SESSIONS */}
          {tab==="live"&&(
            <div>
              <h2 style={{fontSize:18,fontWeight:700,color:"#111827",marginBottom:4}}>🔴 Live Sessions</h2>
              <p style={{fontSize:13,color:"#9ca3af",marginBottom:20}}>Join live sessions from your Mentors — links auto-generated with Jitsi Meet</p>
              {activeSess.length===0?<Empty icon="🔴" title="No live sessions right now" desc="You will get a real-time notification when a Mentor goes live!"/>:(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {activeSess.map(s=>(
                    <div key={s._id} style={{background:"linear-gradient(135deg,#fef2f2,#fff)",border:"2px solid #fca5a5",borderRadius:14,padding:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                          <span style={{width:10,height:10,borderRadius:"50%",background:"#dc2626",display:"inline-block"}}/>
                          <span style={{fontSize:12,fontWeight:700,color:"#dc2626"}}>LIVE NOW</span>
                        </div>
                        <h4 style={{fontSize:15,fontWeight:700,color:"#111827",margin:"0 0 4px"}}>{s.title}</h4>
                        <p style={{fontSize:12,color:"#6b7280",margin:0}}>by {s.Mentor?.name} {s.course?.title?`· ${s.course.title}`:""}</p>
                        <p style={{fontSize:11,color:"#9ca3af",margin:"4px 0 0"}}>Meeting: <a href={s.zoomLink} target="_blank" rel="noreferrer" style={{color:"#0d9488"}}>{s.zoomLink?.slice(0,50)}...</a></p>
                      </div>
                      <button onClick={()=>window.open(s.zoomLink,"_blank","noopener,noreferrer")}
                        style={{background:"#dc2626",color:"#fff",border:"none",fontSize:14,fontWeight:700,padding:"11px 24px",borderRadius:10,cursor:"pointer",flexShrink:0}}>
                        Join Live →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SESSIONS */}
          {tab==="sessions"&&(
            <div>
              <h2 style={{fontSize:18,fontWeight:700,color:"#111827",marginBottom:20}}>Upcoming Sessions</h2>
              {loadingE?<Spinner/>:enrolledList.filter(c=>c?.zoomLink).length===0?<Empty icon="📅" title="No sessions" desc="Enroll in courses with meeting links!" btn="Browse" onBtn={()=>setTab("courses")}/>:(
                enrolledList.filter(c=>c?.zoomLink).map(c=>(
                  <div key={c._id} style={{background:"#fff",borderRadius:12,border:"1px solid #f3f4f6",padding:16,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div>
                      <h4 style={{fontSize:14,fontWeight:600,color:"#111827",margin:0}}>{c.title}</h4>
                      <p style={{fontSize:12,color:"#9ca3af",marginTop:4}}>by {c.Mentor?.name||"Mentor"}</p>
                    </div>
                    <button onClick={()=>window.open(c.zoomLink,"_blank","noopener,noreferrer")} style={{background:"#2563eb",color:"#fff",border:"none",fontSize:12,fontWeight:600,padding:"8px 18px",borderRadius:8,cursor:"pointer"}}>Join</button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* CHAT */}
          {tab==="chat"&&(
            <div style={{height:"calc(100vh - 140px)"}}>
              <h2 style={{fontSize:18,fontWeight:700,color:"#111827",marginBottom:16}}>Messages</h2>
              <div style={{height:"calc(100% - 50px)"}}><Chat/></div>
            </div>
          )}

          {/* FEEDBACK/REVIEWS */}
          {tab==="feedback"&&(
            <div>
              <h2 style={{fontSize:18,fontWeight:700,color:"#111827",marginBottom:4}}>⭐ My Reviews</h2>
              <p style={{fontSize:13,color:"#9ca3af",marginBottom:20}}>Rate and review courses you've enrolled in</p>
              {reviewCourse&&(
                <div style={{background:"#fff",borderRadius:12,border:"2px solid #0d9488",padding:24,marginBottom:24}}>
                  <h3 style={{fontSize:15,fontWeight:700,color:"#111827",marginBottom:4}}>Review: {reviewCourse.title}</h3>
                  <p style={{fontSize:12,color:"#9ca3af",marginBottom:16}}>Your honest feedback helps other Learners</p>
                  <div style={{marginBottom:14}}>
                    <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>Your Rating</label>
                    {stars(reviewForm.rating,true,r=>setReviewForm(p=>({...p,rating:r})))}
                  </div>
                  <div style={{marginBottom:16}}>
                    <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>Comment (optional)</label>
                    <textarea value={reviewForm.comment} onChange={e=>setReviewForm(p=>({...p,comment:e.target.value}))} placeholder="What did you like? What can improve?"
                      style={{width:"100%",padding:"10px 12px",fontSize:13,border:"1px solid #e5e7eb",borderRadius:8,resize:"vertical",minHeight:80,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>handleReview(reviewCourse._id)} disabled={reviewBusy} style={{background:"#0d9488",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:600,cursor:reviewBusy?"not-allowed":"pointer",opacity:reviewBusy?0.7:1}}>
                      {reviewBusy?"Submitting...":"Submit Review ⭐"}
                    </button>
                    <button onClick={()=>setReviewCourse(null)} style={{background:"#f9fafb",color:"#6b7280",border:"1px solid #e5e7eb",borderRadius:8,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                  </div>
                </div>
              )}
              {enrolledList.length===0?<Empty icon="⭐" title="No courses to review" desc="Enroll first!" btn="Browse" onBtn={()=>setTab("courses")}/>:(
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                  {enrolledList.map(c=>{
                    const rv = myReviews.find(r=>(r.course?._id||r.course)?.toString()===c._id?.toString());
                    return (
                      <div key={c._id} style={{background:"#fff",borderRadius:12,border:"1px solid #f3f4f6",padding:16}}>
                        <h4 style={{fontSize:13,fontWeight:700,color:"#111827",margin:"0 0 6px",lineHeight:1.4}}>{c.title}</h4>
                        <p style={{fontSize:11,color:"#9ca3af",margin:"0 0 12px"}}>by {c.Mentor?.name||"Mentor"}</p>
                        {rv?(
                          <div>
                            {stars(rv.rating)}
                            {rv.comment&&<p style={{fontSize:12,color:"#374151",marginTop:6,fontStyle:"italic"}}>"{rv.comment}"</p>}
                            <button onClick={()=>{setReviewCourse(c);setReviewForm({rating:rv.rating,comment:rv.comment||""});}} style={{marginTop:8,fontSize:11,color:"#0d9488",background:"transparent",border:"1px solid #0d9488",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontWeight:600}}>Edit Review</button>
                          </div>
                        ):(
                          <button onClick={()=>{setReviewCourse(c);setReviewForm({rating:5,comment:""}); }} style={{background:"#f0fdf4",color:"#0f766e",border:"1px solid #bbf7d0",borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",width:"100%"}}>⭐ Write Review</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PROFILE */}
          {tab==="profile"&&(
            <div style={{maxWidth:560}}>
              <h2 style={{fontSize:18,fontWeight:700,color:"#111827",marginBottom:20}}>My Profile</h2>
              <div style={{background:"#fff",borderRadius:12,border:"1px solid #f3f4f6",padding:28}}>
                <div style={{textAlign:"center",marginBottom:24}}>
                  <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#0d9488,#7c3aed)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:700,margin:"0 auto 10px"}}>{user?.name?.[0]?.toUpperCase()}</div>
                  <p style={{fontWeight:700,color:"#111827",fontSize:16,margin:0}}>{user?.name}</p>
                  <span style={{fontSize:11,padding:"2px 10px",borderRadius:999,background:"#ccfbf1",color:"#0f766e",fontWeight:600}}>Learner</span>
                </div>
                {profErr&&<div style={{background:"#fef2f2",color:"#dc2626",padding:"8px 12px",borderRadius:8,fontSize:13,marginBottom:16}}>⚠️ {profErr}</div>}
                <form onSubmit={handleProfile}>
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <PF label="Full Name"  value={profile.name}  onChange={v=>setProfile(p=>({...p,name:v}))}  ph="Your full name"/>
                    <div><label style={LS}>Email</label><input value={user?.email||""} disabled style={{...IS,color:"#9ca3af",background:"#f9fafb"}}/></div>
                    <PF label="Phone"      value={profile.phone} onChange={v=>setProfile(p=>({...p,phone:v}))} ph="+91 9876543210"/>
                    <PF label="Skills (comma separated)" value={profile.skills} onChange={v=>setProfile(p=>({...p,skills:v}))} ph="React, Python, UI/UX"/>
                    <div>
                      <label style={LS}>Bio</label>
                      <textarea value={profile.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))} placeholder="Tell Mentors about yourself..."
                        style={{...IS,minHeight:80,resize:"vertical",fontFamily:"inherit"}}/>
                    </div>
                    <button type="submit" disabled={profBusy} style={{background:"#0d9488",color:"#fff",border:"none",borderRadius:8,padding:"11px 0",fontSize:14,fontWeight:600,cursor:profBusy?"not-allowed":"pointer",opacity:profBusy?0.7:1}}>
                      {profBusy?"Saving...":"Save Profile ✅"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        {selectedCourse && (
  <CourseDetailModal
    course={selectedCourse}
    isEnrolled={isEnrolled(selectedCourse._id)}
    onClose={() => setSelectedCourse(null)}
    onEnrollSuccess={() => { fetchE(); fetchR(); }}
    user={user}
  />
)}
      </main>
    </div>
  );
}

function EnrolledCard({ course, onReview }) {
  return (
    <div style={{background:"#fff",borderRadius:12,border:"1px solid #f3f4f6",overflow:"hidden"}}>
      <div style={{height:70,background:"linear-gradient(135deg,#0d9488,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:28}}>📚</span></div>
      <div style={{padding:14}}>
        <h4 style={{fontSize:13,fontWeight:700,color:"#111827",margin:"0 0 4px",lineHeight:1.4}}>{course.title}</h4>
        <p style={{fontSize:11,color:"#9ca3af",margin:"0 0 10px"}}>by {course.Mentor?.name||"Mentor"}</p>
        <div style={{display:"flex",gap:6}}>
          <span style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#f0fdf4",color:"#16a34a",fontWeight:600}}>✅ Enrolled</span>
          <button onClick={onReview} style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#fffbeb",color:"#d97706",fontWeight:600,border:"none",cursor:"pointer"}}>⭐ Review</button>
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course, enrolled, enrolling, onEnroll, onView }) {
  const isPaid = (course.price || 0) > 0;
  return (
    <div
      onClick={onView}
      style={{background:"#fff",borderRadius:12,border:"1px solid #f3f4f6",overflow:"hidden",display:"flex",flexDirection:"column",transition:"box-shadow 0.2s",cursor:"pointer"}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
      <div style={{height:80,background:"linear-gradient(135deg,#0d9488,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        <span style={{fontSize:32}}>📚</span>
        {isPaid && <span style={{position:"absolute",top:8,right:8,background:"#fff",color:"#0f766e",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999}}>₹{course.price}</span>}
        {course.demoVideo && <span style={{position:"absolute",top:8,left:8,background:"rgba(0,0,0,0.45)",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:999}}>🎬 Demo</span>}
      </div>
      <div style={{padding:14,flex:1,display:"flex",flexDirection:"column"}}>
        <h4 style={{fontSize:13,fontWeight:700,color:"#111827",margin:"0 0 4px",lineHeight:1.4}}>{course.title}</h4>
        <p style={{fontSize:11,color:"#9ca3af",marginBottom:8,flex:1}}>{course.description?.slice(0,65)}...</p>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <span style={{fontSize:11,color:"#0d9488",fontWeight:600}}>{course.level||"Beginner"}</span>
          <span style={{fontSize:12,fontWeight:700,color:isPaid?"#111827":"#16a34a"}}>{isPaid?`₹${course.price}`:"Free"}</span>
        </div>
        <button
          onClick={e=>{e.stopPropagation(); isPaid ? onView() : onEnroll();}}
          disabled={enrolled||enrolling}
          style={{width:"100%",padding:"8px",borderRadius:8,border:"none",cursor:enrolled||enrolling?"not-allowed":"pointer",fontWeight:600,fontSize:12,
            background:enrolled?"#f0fdf4":enrolling?"#e0e7ff":isPaid?"#111827":"#0d9488",
            color:enrolled?"#16a34a":enrolling?"#4338ca":"#fff"}}>
          {enrolled?"✅ Enrolled":enrolling?"Enrolling...":isPaid?`💳 Buy ₹${course.price}`:"Enroll Free"}
        </button>
      </div>
    </div>
  );
}

function Empty({ icon, title, desc, btn, onBtn }) {
  return (
    <div style={{textAlign:"center",padding:40,background:"#fff",borderRadius:12,border:"1px dashed #e5e7eb"}}>
      <p style={{fontSize:36,marginBottom:8}}>{icon}</p>
      <p style={{fontWeight:600,color:"#111827",marginBottom:4}}>{title}</p>
      <p style={{fontSize:12,color:"#9ca3af",marginBottom:btn?16:0}}>{desc}</p>
      {btn&&<button onClick={onBtn} style={{background:"#0d9488",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontWeight:600,fontSize:12,cursor:"pointer"}}>{btn}</button>}
    </div>
  );
}

function PF({ label, value, onChange, ph }) {
  return (
    <div>
      <label style={LS}>{label}</label>
      <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} style={IS}/>
    </div>
  );
}

const LS = { fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 };
const IS = { width:"100%", padding:"9px 12px", fontSize:13, border:"1px solid #e5e7eb", borderRadius:8, outline:"none", color:"#111827", fontFamily:"inherit", boxSizing:"border-box" };