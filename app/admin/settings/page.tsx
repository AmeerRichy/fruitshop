"use client";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";

export default function Settings() {
  const [form, setForm] = useState({ deliveryDaysAhead: 7, storeName: "Fruit Shop", city: "Lahore" });
  const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/admin/settings").then(r => r.json()).then(data => { const store = data.find((x: any) => x._id === "store"); if (store) setForm(store); }); }, []);
  const save = async (event: React.FormEvent) => { event.preventDefault(); const response = await fetch("/api/admin/settings/store", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }); setMessage(response.ok ? "Settings saved" : "Could not save settings"); };
  return <AdminLayout><h1 className="display text-4xl font-bold">Store settings</h1><form onSubmit={save} className="card mt-7 grid max-w-2xl gap-4 p-6 sm:grid-cols-2"><label><span className="label">Store name</span><input className="field" value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })}/></label><label><span className="label">City</span><input className="field" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}/></label><label><span className="label">Delivery days ahead</span><input className="field" type="number" min="1" max="30" value={form.deliveryDaysAhead} onChange={e => setForm({ ...form, deliveryDaysAhead: Number(e.target.value) })}/></label>{message && <p className="text-green-700 sm:col-span-2">{message}</p>}<button className="btn btn-primary sm:col-span-2">Save settings</button></form></AdminLayout>;
}
