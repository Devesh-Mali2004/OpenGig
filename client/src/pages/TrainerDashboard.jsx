import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import NotificationBell from "../components/NotificationBell";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import {
  getMyCoursesAPI, createCourseAPI, deleteCourseAPI,
  getCourseStudentsAPI, updateProfileAPI,
  goLiveAPI, endLiveAPI, getMySessionsAPI, getTrainerStatsAPI,
  getCourseReviewsAPI,
} from "../api/api";
import { getGreeting } from "../utils/helpers";

const NAV = [
  { id:"dashboard", label:"Dashboard",  icon:"🏠" },
  { id:"courses",   label:"My Courses", icon:"📚" },
  { id:"students",  label:"Students",   icon:"👥" },
  { id:"reviews",   label:"Reviews",    icon:"⭐" },
  { id:"live",      label:"Go Live",    icon:"🔴" },
  { id:"sessions",  label:"Sessions",   icon:"📅" },
  { id:"chat",      label:"Messages",   icon:"💬" },
  { id:"profile",   label:"Profile",    icon:"👤" },
];

const EMPTY_FORM = { title:"", description:"", category:"", price:"", zoomLink:"", level:"Beginner", duration:"" };

export default function TrainerDashboard() {
  const [tab,            setTab]            = useState("dashboard");
  const [showForm,       setShowForm]       = useState(false);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [formError,      setFormError]      = useState("");
  const [formLoading,    setFormLoading]    = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students,       setStudents]       = useState([]);
  const [loadStudents,   setLoadStudents]   = useState(false);
  const [toast,          setToast]          = useState(null);
  const [courses,        setCourses]        = useState([]);
  const [loadingC,       setLoadingC]       = useState(true);
  const [search,         setSearch]         = useState("");
  const [profileForm,    setProfileForm]    = useState({ name:"", phone:"", bio:"", expertise:"" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError,   setProfileError]   = useState("");
  const [liveForm,       setLiveForm]       = useState({ title:"", courseId:"" });
  const [isLive,         setIsLive]         = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [liveLoading,    setLiveLoading]    = useState(false);
  const [liveError,      setLiveError]      = useState("");
  const [pastSessions,   setPastSessions]   = useState([]);
  const [stats,          setStats]          = useState({ totalCourses:0, totalEnrollments:0, totalSessions:0, liveNow:false });
  const [reviews,        setReviews]        = useState([]);
  const [loadingRev,     setLoadingRev]     = useState(false);
  const statsRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    document.title = `${NAV.find(n=>n.id===tab)?.label||"Dashboard"} — OpenGig Trainer`;
    return () => { document.title = "OpenGig"; };
  }, [tab]);

  useEffect(() => {
    if (user) setProfileForm({ name:user.name||"", phone:user.phone||"", bio:user.bio||"", expertise:Array.isArray(user.expertise)?user.expertise.join(", "):"" });
  }, [user]);

  const fetchCourses = useCallback(async () => {
    setLoadingC(true);
    try { const r = await getMyCoursesAPI(); setCourses(Array.isArray(r.data)?r.data:[]); }
    catch {} finally { setLoadingC(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try { const r = await getTrainerStatsAPI(); setStats(r.data); } catch {}
  }, []);

  const fetchSessions = useCallback(async () => {
    try { const r = await getMySessionsAPI(); setPastSessions(Array.isArray(r.data)?r.data:[]); } catch {}
  }, []);

  useEffect(() => {
    fetchCourses(); fetchStats(); fetchSessions();
    statsRef.current = setInterval(fetchStats, 15000);
    return () => clearInterval(statsRef.current);
  }, [fetchCourses, fetchStats, fetchSessions]);

  // Load reviews when tab opens
  useEffect(() => {
    if (tab==="reviews" && courses.length>0) {
      setLoadingRev(true);
      Promise.all(courses.map(c => getCourseReviewsAPI(c._id).catch(()=>({data:{reviews:[],avgRating:0}}))))
        .then(results => {
          const all = courses.map((c,i) => ({
            course: c,
            reviews: results[i]?.data?.reviews||[],
            avgRating: results[i]?.data?.avgRating||0,
          }));
          setReviews(all);
        })
        .finally(() => setLoadingRev(false));
    }
  }, [tab, courses.length]);

  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };
  const filtered = courses.filter(c => c.title?.toLowerCase().includes(search.toLowerCase())||c.category?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (e) => {
    e.preventDefault(); setFormError("");
    if (!form.title||!form.category) { setFormError("Title and Category required!"); return; }
    setFormLoading(true);
    try {
      const r = await createCourseAPI({...form, price:Number(form.price)||0});
      setCourses(p=>[r.data,...p]);
      setForm(EMPTY_FORM); setShowForm(false);
      toast_("Course created! 🎉 Trainees can now see it.");
      fetchStats();
    } catch(e) { setFormError(e?.response?.data?.message||"Failed."); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try { await deleteCourseAPI(id); setCourses(p=>p.filter(c=>c._id!==id)); toast_("Course deleted."); fetchStats(); }
    catch { toast_("Delete failed.","error"); }
  };

  const handleViewStudents = async (course) => {
    setSelectedCourse(course); setTab("students"); setLoadStudents(true); setStudents([]);
    try { const r = await getCourseStudentsAPI(course._id); setStudents(Array.isArray(r.data)?r.data:[]); }
    catch { toast_("Failed to load students.","error"); }
    finally { setLoadStudents(false); }
  };

  const handleGoLive = async (e) => {
    e.preventDefault(); setLiveError("");
    if (!liveForm.title) { setLiveError("Session title is required!"); return; }
    setLiveLoading(true);
    try {
      const r = await goLiveAPI(liveForm);
      setCurrentSession(r.data.session); setIsLive(true);
      toast_(`🔴 You're live! Meeting link auto-generated.`);
      fetchStats();
    } catch(e) { setLiveError(e?.response?.data?.message||"Failed to go live."); }
    finally { setLiveLoading(false); }
  };

  const handleEndLive = async () => {
    if (!currentSession) return;
    try {
      const { endLiveAPI } = await import("../api/api");
      await endLiveAPI(currentSession._id);
      setIsLive(false); setCurrentSession(null); setLiveForm({title:"",courseId:""});
      toast_("Session ended."); fetchStats(); fetchSessions();
    } catch { toast_("Failed.","error"); }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault(); setProfileError(""); setProfileLoading(true);
    try {
      const p = { name:profileForm.name, phone:profileForm.phone, bio:profileForm.bio, expertise:profileForm.expertise.split(",").map(s=>s.trim()).filter(Boolean) };
      await updateProfileAPI(p);
      localStorage.setItem("opengig_user", JSON.stringify({...user,...p}));
      toast_("Profile updated! ✅");
    } catch(e) { setProfileError(e?.response?.data?.message||"Failed."); }
    finally { setProfileLoading(false); }
  };

  const stars = (n) => [1,2,3,4,5].map(i=><span key={i} style={{color:i<=n?"#f59e0b":"#d1d5db",fontSize:16}}>★</span>);

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#f9fafb",fontFamily:"ui-sans-serif,system-ui,sans-serif"}}>
      <Sidebar activeTab={tab} setActiveTab={setTab} navItems={NAV} role="trainer"/>

      <main style={{marginLeft:220,flex:1,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        <header style={{background:"#fff",borderBottom:"1px solid #f3f4f6",padding:"12px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:30}}>
          <div>
            <h2 style={{fontSize:16,fontWeight:700,color:"#111827",margin:0}}>{getGreeting()}, {user?.name?.split(" ")[0]} 👋</h2>
            <p style={{fontSize:11,color:"#9ca3af",marginTop:2}}>
              Trainer Dashboard
              {stats.liveNow&&<span style={{marginLeft:8,background:"#fef2f2",color:"#dc2626",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999}}>🔴 LIVE NOW</span>}
            </p>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:10,top:8,fontSize:12}}>🔍</span>
              <input type="text" placeholder="Search courses..." value={search}
                onChange={e=>{setSearch(e.target.value);setTab("courses");}}
                style={{paddingLeft:30,paddingRight:12,paddingTop:7,paddingBottom:7,fontSize:12,border:"1px solid #e5e7eb",borderRadius:8,width:180,background:"#f9fafb",color:"#111827",outline:"none"}}/>
            </div>
            <button onClick={()=>setTab("live")}
              style={{background:isLive?"#dc2626":"#ef4444",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              {isLive?"🔴 Live":"🎥 Go Live"}
            </button>
            <NotificationBell/>
            <button onClick={()=>{setShowForm(true);setTab("courses");}}
              style={{background:"#0d9488",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              + Course
            </button>
          </div>
        </header>

        {toast&&<div style={{position:"fixed",bottom:"2rem",right:"2rem",zIndex:9999,padding:"0.75rem 1.5rem",borderRadius:10,fontWeight:600,fontSize:14,background:toast.type==="error"?"#fef2f2":"#f0fdf4",color:toast.type==="error"?"#dc2626":"#16a34a",border:`1px solid ${toast.type==="error"?"#fca5a5":"#86efac"}`,boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}>{toast.msg}</div>}

        <div style={{padding:"24px 28px",flex:1}}>

          {/* DASHBOARD */}
          {tab==="dashboard"&&(
            <div style={{display:"flex",flexDirection:"column",gap:24}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                {[["Courses",stats.totalCourses,"📚","#0f766e"],["Enrollments",stats.totalEnrollments,"👥","#7c3aed"],["Sessions",stats.totalSessions,"🎥","#ea580c"],["Status",stats.liveNow?"🔴 Live":"⚫ Offline","📡",stats.liveNow?"#dc2626":"#6b7280"]].map(([l,v,i,c])=>(
                  <div key={l} style={{background:"#fff",borderRadius:12,padding:"16px 18px",border:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:24}}>{i}</span>
                    <div><p style={{fontSize:20,fontWeight:800,color:c,margin:0}}>{v}</p><p style={{fontSize:12,color:"#6b7280",margin:0}}>{l}</p></div>
                  </div>
                ))}
              </div>
              {isLive&&currentSession&&(
                <div style={{background:"linear-gradient(135deg,#fef2f2,#fee2e2)",border:"1px solid #fca5a5",borderRadius:12,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <p style={{margin:0,fontWeight:700,color:"#dc2626",fontSize:14}}>🔴 You are LIVE</p>
                    <p style={{margin:"4px 0 0",color:"#6b7280",fontSize:12}}>{currentSession.title}</p>
                    <p style={{margin:"2px 0 0",color:"#0d9488",fontSize:11}}>🔗 {currentSession.zoomLink}</p>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>window.open(currentSession.zoomLink,"_blank","noopener,noreferrer")}
                      style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Open Zoom</button>
                    <button onClick={handleEndLive}
                      style={{background:"#dc2626",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>End Session</button>
                  </div>
                </div>
              )}
              <section>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <h3 style={{fontSize:15,fontWeight:700,color:"#111827",margin:0}}>Recent Courses</h3>
                  <button onClick={()=>setTab("courses")} style={{fontSize:12,color:"#0d9488",background:"transparent",border:"none",cursor:"pointer",fontWeight:500}}>View all →</button>
                </div>
                {loadingC?<Spinner/>:courses.length===0?(
                  <EmptyState icon="📚" title="No courses yet" desc="Create your first course!" action="Create Course" onAction={()=>{setShowForm(true);setTab("courses");}}/>
                ):(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                    {courses.slice(0,3).map(c=><CourseCard key={c._id} course={c} onDelete={handleDelete} onStudents={handleViewStudents}/>)}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* COURSES */}
          {tab==="courses"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <h2 style={{fontSize:18,fontWeight:700,color:"#111827",margin:0}}>My Courses <span style={{fontSize:13,color:"#9ca3af",fontWeight:400}}>({filtered.length})</span></h2>
                <button onClick={()=>setShowForm(!showForm)}
                  style={{background:showForm?"#fef2f2":"#0d9488",color:showForm?"#dc2626":"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  {showForm?"✕ Cancel":"+ Add Course"}
                </button>
              </div>
              {showForm&&(
                <div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",padding:24,marginBottom:24}}>
                  <h3 style={{fontSize:15,fontWeight:700,color:"#111827",marginBottom:16}}>Create New Course</h3>
                  {formError&&<div style={{background:"#fef2f2",color:"#dc2626",padding:"8px 12px",borderRadius:8,fontSize:13,marginBottom:12}}>⚠️ {formError}</div>}
                  <form onSubmit={handleCreate}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                      <FF label="Title *"    value={form.title}       onChange={v=>setForm(p=>({...p,title:v}))}       placeholder="e.g. React Masterclass"/>
                      <FF label="Category *" value={form.category}    onChange={v=>setForm(p=>({...p,category:v}))}    placeholder="e.g. Web Dev"/>
                      <FF label="Price (₹)"  value={form.price}       onChange={v=>setForm(p=>({...p,price:v}))}       placeholder="0 for Free" type="number"/>
                      <FF label="Duration"   value={form.duration}    onChange={v=>setForm(p=>({...p,duration:v}))}    placeholder="e.g. 8 weeks"/>
                      <FF label="Zoom Link (optional)" value={form.zoomLink} onChange={v=>setForm(p=>({...p,zoomLink:v}))} placeholder="https://zoom.us/j/..."/>
                      <div>
                        <label style={LS}>Level</label>
                        <select value={form.level} onChange={e=>setForm(p=>({...p,level:e.target.value}))} style={{...IS,background:"#fff"}}>
                          <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                        </select>
                      </div>
                    </div>
                    <div style={{marginBottom:16}}>
                      <label style={LS}>Description *</label>
                      <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Describe your course..."
                        style={{...IS,minHeight:80,resize:"vertical",fontFamily:"inherit"}}/>
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      <button type="submit" disabled={formLoading} style={{background:"#0d9488",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:600,cursor:formLoading?"not-allowed":"pointer",opacity:formLoading?0.7:1}}>
                        {formLoading?"Creating...":"Create Course"}
                      </button>
                      <button type="button" onClick={()=>{setShowForm(false);setForm(EMPTY_FORM);setFormError("");}}
                        style={{background:"#f9fafb",color:"#6b7280",border:"1px solid #e5e7eb",borderRadius:8,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}
              {loadingC?<Spinner/>:filtered.length===0?(
                <EmptyState icon="📚" title={search?"No matches":"No courses yet"} desc={search?"Try different keyword":"Create your first course!"}/>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                  {filtered.map(c=><CourseCard key={c._id} course={c} onDelete={handleDelete} onStudents={handleViewStudents}/>)}
                </div>
              )}
            </div>
          )}

          {/* STUDENTS */}
          {tab==="students"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <h2 style={{fontSize:18,fontWeight:700,color:"#111827",margin:0}}>Students {selectedCourse?`— ${selectedCourse.title}`:""}</h2>
                {selectedCourse&&<button onClick={()=>handleViewStudents(selectedCourse)} style={{fontSize:12,color:"#0d9488",background:"transparent",border:"1px solid #0d9488",borderRadius:6,padding:"5px 12px",cursor:"pointer"}}>🔄 Refresh</button>}
              </div>
              <p style={{fontSize:13,color:"#9ca3af",marginBottom:20}}>{selectedCourse?`${students.length} student(s)`:"Select a course to view students"}</p>
              {!selectedCourse?(
                <EmptyState icon="👥" title="No course selected" desc="Click 'Students' on any course!" action="Go to Courses" onAction={()=>setTab("courses")}/>
              ):loadStudents?<Spinner/>:students.length===0?(
                <EmptyState icon="👥" title="No students yet" desc="Share your course to get students!"/>
              ):(
                <div style={{background:"#fff",borderRadius:12,border:"1px solid #f3f4f6",overflow:"hidden"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr style={{background:"#f9fafb"}}>{["#","Name","Email","Phone","Enrolled On"].map(h=><th key={h} style={{padding:"12px 16px",fontSize:12,fontWeight:600,color:"#6b7280",textAlign:"left",borderBottom:"1px solid #f3f4f6"}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {students.map((s,i)=>(
                        <tr key={s._id} onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                          <td style={{padding:"12px 16px",fontSize:13,color:"#9ca3af"}}>{i+1}</td>
                          <td style={{padding:"12px 16px",fontSize:13,fontWeight:600,color:"#111827"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:28,height:28,borderRadius:"50%",background:"#ccfbf1",color:"#0f766e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{s.trainee?.name?.[0]?.toUpperCase()||"?"}</div>
                              {s.trainee?.name||"—"}
                            </div>
                          </td>
                          <td style={{padding:"12px 16px",fontSize:13,color:"#6b7280"}}>{s.trainee?.email||"—"}</td>
                          <td style={{padding:"12px 16px",fontSize:13,color:"#6b7280"}}>{s.trainee?.phone||"—"}</td>
                          <td style={{padding:"12px 16px",fontSize:13,color:"#6b7280"}}>{new Date(s.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* REVIEWS */}
          {tab==="reviews"&&(
            <div>
              <h2 style={{fontSize:18,fontWeight:700,color:"#111827",marginBottom:4}}>⭐ Course Reviews</h2>
              <p style={{fontSize:13,color:"#9ca3af",marginBottom:20}}>See what trainees are saying about your courses</p>
              {loadingRev?<Spinner/>:reviews.length===0?(
                <EmptyState icon="⭐" title="No reviews yet" desc="Reviews will appear here once trainees rate your courses!"/>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {reviews.map(({course,reviews:revs,avgRating})=>(
                    <div key={course._id} style={{background:"#fff",borderRadius:12,border:"1px solid #f3f4f6",padding:20}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                        <div>
                          <h3 style={{fontSize:14,fontWeight:700,color:"#111827",margin:0}}>{course.title}</h3>
                          <p style={{fontSize:12,color:"#9ca3af",margin:"2px 0 0"}}>{revs.length} review(s)</p>
                        </div>
                        <div style={{textAlign:"center"}}>
                          <p style={{fontSize:24,fontWeight:800,color:"#f59e0b",margin:0}}>{avgRating||"—"}</p>
                          <div style={{display:"flex",gap:2}}>{stars(Math.round(avgRating))}</div>
                        </div>
                      </div>
                      {revs.length===0?(
                        <p style={{fontSize:13,color:"#9ca3af",fontStyle:"italic"}}>No reviews yet for this course.</p>
                      ):(
                        <div style={{display:"flex",flexDirection:"column",gap:10}}>
                          {revs.map(r=>(
                            <div key={r._id} style={{background:"#f9fafb",borderRadius:8,padding:"12px 14px"}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                                <span style={{fontSize:13,fontWeight:600,color:"#111827"}}>{r.user?.name||"Trainee"}</span>
                                <div style={{display:"flex",gap:2}}>{stars(r.rating)}</div>
                              </div>
                              {r.comment&&<p style={{fontSize:13,color:"#374151",margin:0,fontStyle:"italic"}}>"{r.comment}"</p>}
                              <p style={{fontSize:11,color:"#9ca3af",margin:"4px 0 0"}}>{new Date(r.createdAt).toLocaleDateString()}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* GO LIVE */}
          {tab==="live"&&(
            <div style={{maxWidth:600}}>
              <h2 style={{fontSize:18,fontWeight:700,color:"#111827",marginBottom:4}}>🔴 Go Live</h2>
              <p style={{fontSize:13,color:"#9ca3af",marginBottom:24}}>Start a session — meeting link is auto-generated, trainees notified instantly!</p>
              {isLive&&currentSession?(
                <div style={{background:"linear-gradient(135deg,#fef2f2,#fee2e2)",border:"2px solid #fca5a5",borderRadius:16,padding:28,textAlign:"center"}}>
                  <div style={{width:64,height:64,borderRadius:"50%",background:"#dc2626",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px"}}>🔴</div>
                  <h3 style={{fontSize:20,fontWeight:800,color:"#dc2626",margin:"0 0 8px"}}>You Are Live!</h3>
                  <p style={{fontSize:14,color:"#6b7280",margin:"0 0 8px"}}>{currentSession.title}</p>
                  <p style={{fontSize:12,color:"#0d9488",margin:"0 0 20px",wordBreak:"break-all"}}>🔗 {currentSession.zoomLink}</p>
                  <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                    <button onClick={()=>window.open(currentSession.zoomLink,"_blank","noopener,noreferrer")}
                      style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontSize:14,fontWeight:600,cursor:"pointer"}}>🎥 Open Zoom</button>
                    <button onClick={handleEndLive}
                      style={{background:"#dc2626",color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontSize:14,fontWeight:600,cursor:"pointer"}}>⏹ End Session</button>
                  </div>
                </div>
              ):(
                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",padding:28}}>
                  {liveError&&<div style={{background:"#fef2f2",color:"#dc2626",padding:"10px 14px",borderRadius:8,fontSize:13,marginBottom:16}}>⚠️ {liveError}</div>}
                  <form onSubmit={handleGoLive}>
                    <FF label="Session Title *" value={liveForm.title} onChange={v=>setLiveForm(p=>({...p,title:v}))} placeholder="e.g. React Hooks Deep Dive"/>
                    <div style={{marginTop:14}}>
                      <label style={LS}>Course (Optional — notifies enrolled trainees only)</label>
                      <select value={liveForm.courseId} onChange={e=>setLiveForm(p=>({...p,courseId:e.target.value}))} style={{...IS,background:"#fff"}}>
                        <option value="">— Notify ALL trainees —</option>
                        {courses.map(c=><option key={c._id} value={c._id}>{c.title}</option>)}
                      </select>
                    </div>
                    <p style={{fontSize:11,color:"#9ca3af",margin:"10px 0 16px"}}>✅ Meeting link will be auto-generated using Jitsi Meet (free, no account needed)</p>
                    <button type="submit" disabled={liveLoading}
                      style={{width:"100%",background:liveLoading?"#fca5a5":"#dc2626",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:15,fontWeight:700,cursor:liveLoading?"not-allowed":"pointer"}}>
                      {liveLoading?"Starting...":"🔴 Go Live Now"}
                    </button>
                  </form>
                </div>
              )}
              {pastSessions.length>0&&(
                <div style={{marginTop:24}}>
                  <h3 style={{fontSize:14,fontWeight:700,color:"#111827",marginBottom:10}}>Past Sessions</h3>
                  {pastSessions.map(s=>(
                    <div key={s._id} style={{background:"#fff",borderRadius:10,border:"1px solid #f3f4f6",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div>
                        <p style={{fontSize:13,fontWeight:600,color:"#111827",margin:0}}>{s.title}</p>
                        <p style={{fontSize:11,color:"#9ca3af",margin:"2px 0 0"}}>{new Date(s.createdAt).toLocaleString()}</p>
                      </div>
                      <span style={{fontSize:11,padding:"2px 8px",borderRadius:999,fontWeight:600,background:s.isLive?"#fef2f2":"#f3f4f6",color:s.isLive?"#dc2626":"#6b7280"}}>
                        {s.isLive?"🔴 Live":"⏹ Ended"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SESSIONS */}
          {tab==="sessions"&&(
            <div>
              <h2 style={{fontSize:18,fontWeight:700,color:"#111827",marginBottom:20}}>Zoom Sessions</h2>
              {loadingC?<Spinner/>:courses.filter(c=>c.zoomLink).length===0?(
                <EmptyState icon="🎥" title="No sessions" desc="Add a Zoom link when creating a course!"/>
              ):(
                courses.filter(c=>c.zoomLink).map(c=>(
                  <div key={c._id} style={{background:"#fff",borderRadius:12,border:"1px solid #f3f4f6",padding:16,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div>
                      <h4 style={{fontSize:14,fontWeight:600,color:"#111827",margin:0}}>{c.title}</h4>
                      <p style={{fontSize:12,color:"#9ca3af",marginTop:4}}>{c.category} · {c.level}</p>
                    </div>
                    <button onClick={()=>window.open(c.zoomLink,"_blank","noopener,noreferrer")}
                      style={{background:"#2563eb",color:"#fff",border:"none",fontSize:12,fontWeight:600,padding:"8px 18px",borderRadius:8,cursor:"pointer"}}>🎥 Start</button>
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

          {/* PROFILE */}
          {tab==="profile"&&(
            <div style={{maxWidth:560}}>
              <h2 style={{fontSize:18,fontWeight:700,color:"#111827",marginBottom:20}}>My Profile</h2>
              <div style={{background:"#fff",borderRadius:12,border:"1px solid #f3f4f6",padding:28}}>
                <div style={{textAlign:"center",marginBottom:24}}>
                  <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#0d9488,#7c3aed)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:700,margin:"0 auto 10px"}}>{user?.name?.[0]?.toUpperCase()}</div>
                  <p style={{fontWeight:700,color:"#111827",fontSize:16,margin:0}}>{user?.name}</p>
                  <span style={{fontSize:11,padding:"2px 10px",borderRadius:999,background:"#dbeafe",color:"#1d4ed8",fontWeight:600}}>Trainer</span>
                </div>
                {profileError&&<div style={{background:"#fef2f2",color:"#dc2626",padding:"8px 12px",borderRadius:8,fontSize:13,marginBottom:16}}>⚠️ {profileError}</div>}
                <form onSubmit={handleProfileSave}>
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <FF label="Full Name"  value={profileForm.name}      onChange={v=>setProfileForm(p=>({...p,name:v}))}      placeholder="Your full name"/>
                    <div><label style={LS}>Email</label><input value={user?.email||""} disabled style={{...IS,color:"#9ca3af",background:"#f9fafb"}}/></div>
                    <FF label="Phone"      value={profileForm.phone}     onChange={v=>setProfileForm(p=>({...p,phone:v}))}     placeholder="+91 9876543210"/>
                    <FF label="Expertise (comma separated)" value={profileForm.expertise} onChange={v=>setProfileForm(p=>({...p,expertise:v}))} placeholder="React, Node.js"/>
                    <div>
                      <label style={LS}>Bio</label>
                      <textarea value={profileForm.bio} onChange={e=>setProfileForm(p=>({...p,bio:e.target.value}))} placeholder="Tell students about yourself..."
                        style={{...IS,minHeight:80,resize:"vertical",fontFamily:"inherit"}}/>
                    </div>
                    <button type="submit" disabled={profileLoading} style={{background:"#0d9488",color:"#fff",border:"none",borderRadius:8,padding:"11px 0",fontSize:14,fontWeight:600,cursor:profileLoading?"not-allowed":"pointer",opacity:profileLoading?0.7:1}}>
                      {profileLoading?"Saving...":"Save Profile ✅"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CourseCard({ course, onDelete, onStudents }) {
  return (
    <div style={{background:"#fff",borderRadius:12,border:"1px solid #f3f4f6",padding:16,transition:"box-shadow 0.2s"}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:11,padding:"2px 8px",borderRadius:999,background:"#ccfbf1",color:"#0f766e",fontWeight:600}}>{course.category||"General"}</span>
        <span style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#f3f4f6",color:"#6b7280",fontWeight:600}}>{course.level||"Beginner"}</span>
      </div>
      <h3 style={{fontSize:14,fontWeight:700,color:"#111827",margin:"8px 0 4px",lineHeight:1.3}}>{course.title}</h3>
      <p style={{fontSize:12,color:"#9ca3af",marginBottom:12,lineHeight:1.4}}>{course.description?.slice(0,80)||"No description"}...</p>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontSize:14,fontWeight:700,color:"#0f766e"}}>{!course.price||course.price===0?"Free":`₹${course.price}`}</span>
        {course.duration&&<span style={{fontSize:11,color:"#9ca3af"}}>⏱ {course.duration}</span>}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>onStudents(course)} style={{flex:1,padding:"7px 0",background:"#f0fdf4",color:"#0f766e",border:"1px solid #bbf7d0",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>👥 Students</button>
        <button onClick={()=>onDelete(course._id)} style={{flex:1,padding:"7px 0",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>🗑 Delete</button>
      </div>
    </div>
  );
}

function FF({ label, value, onChange, placeholder, type="text" }) {
  return (
    <div>
      <label style={LS}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={IS}/>
    </div>
  );
}

function EmptyState({ icon, title, desc, action, onAction }) {
  return (
    <div style={{textAlign:"center",padding:48,background:"#fff",borderRadius:12,border:"1px dashed #e5e7eb"}}>
      <p style={{fontSize:40,marginBottom:12}}>{icon}</p>
      <p style={{fontSize:15,fontWeight:700,color:"#111827",marginBottom:6}}>{title}</p>
      <p style={{fontSize:13,color:"#9ca3af",marginBottom:action?16:0}}>{desc}</p>
      {action&&<button onClick={onAction} style={{background:"#0d9488",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontWeight:600,fontSize:12,cursor:"pointer"}}>{action}</button>}
    </div>
  );
}

const LS = { fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 };
const IS = { width:"100%", padding:"9px 12px", fontSize:13, border:"1px solid #e5e7eb", borderRadius:8, outline:"none", color:"#111827", fontFamily:"inherit", boxSizing:"border-box" };