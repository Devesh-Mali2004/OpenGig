export const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export const formatPrice = (price) => {
  if (!price || price === 0) return "Free";
  return `₹${price}`;
};

export const getInitials = (name) => {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

export const getToken = () => localStorage.getItem("opengig_token");

export const getUser = () => {
  try { return JSON.parse(localStorage.getItem("opengig_user")); }
  catch { return null; }
};