import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Admin.css";

const TOKEN_KEY = "khizar_admin_token";
const emptyProject = {
  id: "",
  title: "",
  tag: "",
  link: "",
  category: "Branding",
  span: "sm",
  file: null,
};
const emptyClient = {
  id: "",
  name: "",
  alt: "",
  file: null,
};
const CATEGORIES = ["Branding", "Social", "UI/UX", "Logo", "Poster", "Print", "Events", "Other"];
const SPANS = [
  { value: "lg", label: "Large" },
  { value: "md", label: "Medium" },
  { value: "sm", label: "Small" },
  { value: "xs", label: "Compact" },
];

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [password, setPassword] = useState("");
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");
  const [clientPreview, setClientPreview] = useState("");
  const [form, setForm] = useState(emptyProject);
  const [clientForm, setClientForm] = useState(emptyClient);
  const [tab, setTab] = useState("work");

  const editing = Boolean(form.id);
  const editingClient = Boolean(clientForm.id);

  async function loadProjects() {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data.projects || []);
  }

  async function loadClients() {
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data.clients || []);
  }

  async function loadInbox(authToken = token) {
    if (!authToken) return;
    const res = await fetch("/api/messages", {
      headers: { authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setInbox(data.messages || []);
  }

  useEffect(() => {
    Promise.all([loadProjects(), loadClients()]).catch(() =>
      setMessage("Could not load portfolio data.")
    );
  }, []);

  useEffect(() => {
    if (token) loadInbox(token).catch(() => {});
  }, [token]);

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword("");
      await loadInbox(data.token);
      setMessage("Logged in.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setMessage("Logged out.");
  }

  function resetForm() {
    setForm(emptyProject);
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview("");
  }

  function resetClientForm() {
    setClientForm(emptyClient);
    if (clientPreview?.startsWith("blob:")) URL.revokeObjectURL(clientPreview);
    setClientPreview("");
  }

  function startEdit(project) {
    setForm({
      id: project.id,
      title: project.title || "",
      tag: project.tag || "",
      link: project.link || "",
      category: project.category || "Branding",
      span: project.span || "sm",
      file: null,
    });
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(project.image || "");
    setMessage(`Editing “${project.title}”.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEditClient(client) {
    setClientForm({
      id: client.id,
      name: client.name || "",
      alt: client.alt || "",
      file: null,
    });
    if (clientPreview?.startsWith("blob:")) URL.revokeObjectURL(clientPreview);
    setClientPreview(client.logo || "");
    setMessage(`Editing client “${client.name}”.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onFileChange(event) {
    const file = event.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, file }));
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : form.id ? preview : "");
  }

  function onClientFileChange(event) {
    const file = event.target.files?.[0] || null;
    setClientForm((prev) => ({ ...prev, file }));
    if (clientPreview?.startsWith("blob:")) URL.revokeObjectURL(clientPreview);
    setClientPreview(
      file ? URL.createObjectURL(file) : clientForm.id ? clientPreview : ""
    );
  }

  async function save(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setMessage("Title is required.");
      return;
    }
    if (!editing && !form.file) {
      setMessage("Image is required for new posts.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const body = new FormData();
      if (editing) body.append("id", form.id);
      body.append("title", form.title.trim());
      body.append("tag", form.tag.trim() || "Selected Work");
      body.append("category", form.category);
      body.append("span", form.span);
      body.append("link", form.link.trim());
      if (form.file) body.append("file", form.file);

      const res = await fetch("/api/projects", {
        method: editing ? "PUT" : "POST",
        headers: { authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setProjects(data.projects || []);
      resetForm();
      setMessage(editing ? "Post updated." : "Uploaded — now live on the portfolio.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveClient(event) {
    event.preventDefault();
    if (!clientForm.name.trim()) {
      setMessage("Client name is required.");
      return;
    }
    if (!editingClient && !clientForm.file) {
      setMessage("Logo is required for new clients.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const body = new FormData();
      if (editingClient) body.append("id", clientForm.id);
      body.append("name", clientForm.name.trim());
      body.append("alt", clientForm.alt.trim() || clientForm.name.trim());
      if (clientForm.file) body.append("file", clientForm.file);

      const res = await fetch("/api/clients", {
        method: editingClient ? "PUT" : "POST",
        headers: { authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setClients(data.clients || []);
      resetClientForm();
      setMessage(editingClient ? "Client updated." : "Client added — live in the marquee.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this project from the portfolio?")) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setProjects(data.projects || []);
      if (form.id === id) resetForm();
      setMessage("Deleted.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeClient(id) {
    if (!window.confirm("Delete this client from the portfolio?")) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/clients?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setClients(data.clients || []);
      if (clientForm.id === id) resetClientForm();
      setMessage("Client deleted.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin">
      <header className="admin__top">
        <div>
          <p className="admin__eyebrow">Khizar Portfolio</p>
          <h1>Admin</h1>
        </div>
        <div className="admin__top-actions">
          <Link className="admin__link" to="/">
            View site
          </Link>
          {token ? (
            <button className="admin__ghost" type="button" onClick={logout}>
              Log out
            </button>
          ) : null}
        </div>
      </header>

      {!token ? (
        <form className="admin__card admin__login" onSubmit={login}>
          <h2>Sign in</h2>
          <p>Enter the admin password to manage work, clients, and inbox.</p>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button className="admin__btn" type="submit" disabled={busy}>
            {busy ? "Checking…" : "Enter admin"}
          </button>
        </form>
      ) : (
        <>
          <div className="admin__tabs">
            <button
              type="button"
              className={`admin__tab${tab === "work" ? " is-active" : ""}`}
              onClick={() => setTab("work")}
            >
              Work
            </button>
            <button
              type="button"
              className={`admin__tab${tab === "clients" ? " is-active" : ""}`}
              onClick={() => setTab("clients")}
            >
              Clients
            </button>
            <button
              type="button"
              className={`admin__tab${tab === "inbox" ? " is-active" : ""}`}
              onClick={() => {
                setTab("inbox");
                loadInbox();
              }}
            >
              Inbox ({inbox.length})
            </button>
          </div>

          {tab === "inbox" ? (
            <section className="admin__card">
              <h2>Contact inbox</h2>
              <p>Messages from the portfolio contact form.</p>
              <div className="admin__list">
                {inbox.length === 0 ? (
                  <p className="admin__empty">No messages yet.</p>
                ) : (
                  inbox.map((item) => (
                    <article className="admin__message-card" key={item.id}>
                      <strong>{item.name}</strong>
                      <a href={`mailto:${item.email}`}>{item.email}</a>
                      <p>{item.message}</p>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </article>
                  ))
                )}
              </div>
            </section>
          ) : null}

          {tab === "clients" ? (
            <div className="admin__grid">
              <form className="admin__card" onSubmit={saveClient}>
                <h2>{editingClient ? "Edit client" : "Add client"}</h2>
                <p>
                  {editingClient
                    ? "Update name or replace the logo. Leave logo empty to keep the current one."
                    : "Clients appear in the scrolling marquee on the homepage."}
                </p>

                <label>
                  Client name
                  <input
                    value={clientForm.name}
                    onChange={(e) =>
                      setClientForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Alkhidmat Foundation"
                    required
                  />
                </label>

                <label>
                  Logo alt text (optional)
                  <input
                    value={clientForm.alt}
                    onChange={(e) =>
                      setClientForm((p) => ({ ...p, alt: e.target.value }))
                    }
                    placeholder="Accessible description of the logo"
                  />
                </label>

                <label className="admin__file">
                  Logo {editingClient ? "(optional)" : ""}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onClientFileChange}
                    required={!editingClient && !clientForm.file}
                  />
                </label>

                {clientPreview ? (
                  <img
                    className="admin__preview admin__preview--logo"
                    src={clientPreview}
                    alt="Logo preview"
                  />
                ) : null}

                <div className="admin__actions">
                  <button className="admin__btn" type="submit" disabled={busy}>
                    {busy
                      ? "Saving…"
                      : editingClient
                        ? "Save changes"
                        : "Add client"}
                  </button>
                  {editingClient ? (
                    <button
                      className="admin__ghost"
                      type="button"
                      onClick={resetClientForm}
                      disabled={busy}
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>

              <section className="admin__card">
                <h2>Live clients ({clients.length})</h2>
                <div className="admin__list">
                  {clients.length === 0 ? (
                    <p className="admin__empty">No clients yet.</p>
                  ) : (
                    clients.map((client) => (
                      <article className="admin__item" key={client.id}>
                        <img src={client.logo} alt="" />
                        <div>
                          <strong>{client.name}</strong>
                          <span>{client.alt || "Client logo"}</span>
                        </div>
                        <div className="admin__item-actions">
                          <button
                            className="admin__ghost"
                            type="button"
                            disabled={busy}
                            onClick={() => startEditClient(client)}
                          >
                            Edit
                          </button>
                          <button
                            className="admin__danger"
                            type="button"
                            disabled={busy}
                            onClick={() => removeClient(client.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          ) : null}

          {tab === "work" ? (
            <div className="admin__grid">
              <form className="admin__card" onSubmit={save}>
                <h2>{editing ? "Edit post" : "Upload work"}</h2>
                <p>
                  {editing
                    ? "Update title, link, image, or category. Leave image empty to keep the current one."
                    : "New posts appear in the portfolio work grid immediately."}
                </p>

                <label>
                  Title
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="e.g. Ramadan Campaign Kit"
                    required
                  />
                </label>

                <label>
                  Tag / subtitle
                  <input
                    value={form.tag}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, tag: e.target.value }))
                    }
                    placeholder="e.g. Social Media"
                  />
                </label>

                <label>
                  Project link (optional)
                  <input
                    value={form.link}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, link: e.target.value }))
                    }
                    placeholder="https://behance.net/... or Instagram post"
                    type="url"
                  />
                </label>

                <div className="admin__row">
                  <label>
                    Category
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, category: e.target.value }))
                      }
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Card size
                    <select
                      value={form.span}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, span: e.target.value }))
                      }
                    >
                      {SPANS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="admin__file">
                  Image {editing ? "(optional)" : ""}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    required={!editing && !form.file}
                  />
                </label>

                {preview ? (
                  <img className="admin__preview" src={preview} alt="Upload preview" />
                ) : null}

                <div className="admin__actions">
                  <button className="admin__btn" type="submit" disabled={busy}>
                    {busy
                      ? "Saving…"
                      : editing
                        ? "Save changes"
                        : "Upload to portfolio"}
                  </button>
                  {editing ? (
                    <button
                      className="admin__ghost"
                      type="button"
                      onClick={resetForm}
                      disabled={busy}
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>

              <section className="admin__card">
                <h2>Live projects ({projects.length})</h2>
                <div className="admin__list">
                  {projects.map((project) => (
                    <article className="admin__item" key={project.id}>
                      <img src={project.image} alt="" />
                      <div>
                        <strong>{project.title}</strong>
                        <span>
                          {project.category} · {project.tag}
                        </span>
                        {project.link ? (
                          <a
                            className="admin__item-link"
                            href={project.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open link
                          </a>
                        ) : null}
                      </div>
                      <div className="admin__item-actions">
                        <button
                          className="admin__ghost"
                          type="button"
                          disabled={busy}
                          onClick={() => startEdit(project)}
                        >
                          Edit
                        </button>
                        <button
                          className="admin__danger"
                          type="button"
                          disabled={busy}
                          onClick={() => remove(project.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </>
      )}

      {message ? <p className="admin__message">{message}</p> : null}
    </div>
  );
}
