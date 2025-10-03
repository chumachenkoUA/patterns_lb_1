let users = [];
let nextId = 1;

class User {
    #password;

    constructor(name, email, password) {
        this.id = nextId++;
        this.name = name;
        this.email = email;
        this.#password = password;
        this.warnCount = 0;
        this.isMuted = false;
        this.mutedUntil = 0;
        users.push(this);
    }

    getInfo() {
        return {id: this.id, name: this.name, email: this.email, role: this.getRole()};
    }

    getRole() {
        return this.constructor.name;
    }

    checkPassword(input) {
        return input === this.#password;
    }

    setPassword(newPass) {
        this.#password = newPass;
    }
}

class Admin extends User {
    #canTouch(user) {
        return !(user instanceof Admin) && !(user instanceof SuperAdmin);
    }

    deleteUser(user) {
        if (!this.#canTouch(user)) {
            alert("Відхилено: не можна видалити Admin або SuperAdmin.");
            return;
        }
        users = users.filter(u => u.id !== user.id);
        renderTable();
    }

    resetPassword(user, newPassword) {
        if (!this.#canTouch(user)) {
            alert("Відхилено: не можна змінити пароль Admin/SuperAdmin.");
            return;
        }
        user.setPassword(newPassword);
        alert(`Пароль користувача ${user.name} змінено.`);
    }
}

class Moderator extends User {
    #canTouch(user) {
        return !(user instanceof Admin) && !(user instanceof SuperAdmin) && !(user instanceof Moderator);
    }

    warnUser(user) {
        if (!this.#canTouch(user)) {
            alert("Відхилено: немає прав для попередження цього користувача.");
            return;
        }
        user.warnCount += 1;
        alert(`Користувачеві ${user.name} винесено попередження (${user.warnCount}).`);
        renderTable();
    }

    muteUser(user, durationMs) {
        if (!this.#canTouch(user)) {
            alert("Відхилено: немає прав для м'юту цього користувача.");
            return;
        }
        user.isMuted = true;
        user.mutedUntil = Date.now() + durationMs;
        alert(`Користувача ${user.name} зам'ючено на ${Math.round(durationMs / 1000)} сек.`);
        renderTable();

        setTimeout(() => {
            user.isMuted = false;
            user.mutedUntil = 0;
            renderTable();
        }, durationMs);
    }
}

class SuperAdmin extends Admin {
    createAdmin(name, email, password) {
        return new Admin(name, email, password);
    }

    deleteAdmin(user) {
        if (user instanceof Admin) {
            users = users.filter(u => u.id !== user.id);
            alert(`Адміна ${user.name} видалено.`);
            renderTable();
        } else if (user instanceof SuperAdmin) {
            alert("Не можна видалити SuperAdmin.");
        } else {
            alert("Це не Admin.");
        }
    }
}

const byId = (id) => document.getElementById(id);

function isMutedNow(u) {
    return Boolean(u.isMuted && u.mutedUntil && u.mutedUntil > Date.now());
}

function renderTable() {
    const tbody = byId("usersTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    users.forEach(user => {
        const tr = document.createElement("tr");

        const mutedText = isMutedNow(user)
            ? `Так (до ${new Date(user.mutedUntil).toLocaleTimeString()})`
            : "Ні";

        tr.innerHTML = `
      <td>${user.id}</td>
      <td><span class="role">${user.getRole()}</span></td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.warnCount}</td>
      <td>${mutedText}</td>
      <td><div class="actions"></div></td>
    `;

        const actions = tr.querySelector(".actions");

        addBtn(actions, "Info", "btn-ghost", () => {
            if (isMutedNow(user)) {
                alert("Вас зам'ючено. Дія недоступна.");
                return;
            }
            const info = user.getInfo();
            alert(`ID: ${info.id}\nName: ${info.name}\nEmail: ${info.email}\nRole: ${info.role}`);
        });

        addBtn(actions, "Check PW", "btn-ghost", () => {
            if (isMutedNow(user)) {
                alert("Вас зам'ючено. Дія недоступна.");
                return;
            }
            const input = prompt("Введіть пароль для перевірки:");
            if (input !== null) {
                alert(user.checkPassword(input) ? "Пароль вірний" : "Пароль хибний");
            }
        });

        if (user instanceof Admin) {
            addBtn(actions, "Delete user", "btn-danger", () => {
                if (isMutedNow(user)) {
                    alert("Вас зам'ючено. Дія недоступна.");
                    return;
                }
                const idStr = prompt("ID користувача для видалення:");
                const target = findUserById(idStr);
                if (target) user.deleteUser(target);
                else alert("Користувача не знайдено.");
            });

            addBtn(actions, "Reset PW", "btn-warn", () => {
                if (isMutedNow(user)) {
                    alert("Вас зам'ючено. Дія недоступна.");
                    return;
                }
                const idStr = prompt("ID користувача для зміни пароля:");
                const target = findUserById(idStr);
                if (target) {
                    const np = prompt("Новий пароль:");
                    if (np) user.resetPassword(target, np);
                } else {
                    alert("Користувача не знайдено.");
                }
            });
        }

        if (user instanceof Moderator) {
            addBtn(actions, "Warn", "btn-warn", () => {
                if (isMutedNow(user)) {
                    alert("Вас зам'ючено. Дія недоступна.");
                    return;
                }
                const idStr = prompt("ID користувача для попередження:");
                const target = findUserById(idStr);
                if (target) user.warnUser(target);
                else alert("Користувача не знайдено.");
            });

            addBtn(actions, "Mute 60s", "btn-warn", () => {
                if (isMutedNow(user)) {
                    alert("Вас зам'ючено. Дія недоступна.");
                    return;
                }
                const idStr = prompt("ID користувача для м'юту:");
                const target = findUserById(idStr);
                if (target) user.muteUser(target, 60_000);
                else alert("Користувача не знайдено.");
            });
        }

        if (user instanceof SuperAdmin) {
            addBtn(actions, "Create Admin", "btn-primary", () => {
                if (isMutedNow(user)) {
                    alert("Вас зам'ючено. Дія недоступна.");
                    return;
                }
                const name = prompt("Ім’я нового Admin:");
                if (!name) return;
                const email = prompt("Email нового Admin:");
                if (!email) return;
                const pw = prompt("Пароль нового Admin:");
                if (!pw) return;
                user.createAdmin(name, email, pw);
                renderTable();
            });

            addBtn(actions, "Delete Admin", "btn-danger", () => {
                if (isMutedNow(user)) {
                    alert("Вас зам'ючено. Дія недоступна.");
                    return;
                }
                const idStr = prompt("ID Admin для видалення:");
                const target = findUserById(idStr);
                if (target) user.deleteAdmin(target);
                else alert("Користувача не знайдено.");
            });
        }

        if (isMutedNow(user)) {
            actions.querySelectorAll("button").forEach(btn => {
                btn.disabled = true;
                btn.title = "Користувача зам'ючено";
            });
        }

        tbody.appendChild(tr);
    });
}

function addBtn(parent, text, cls, onClick) {
    const b = document.createElement("button");
    b.textContent = text;
    b.className = `btn ${cls}`;
    b.addEventListener("click", onClick);
    parent.appendChild(b);
}

function findUserById(idStr) {
    const id = Number(idStr);
    if (!Number.isFinite(id)) return null;
    return users.find(u => u.id === id) || null;
}

function onCreateUserSubmit(e) {
    e.preventDefault();
    const name = byId("name").value.trim();
    const email = byId("email").value.trim();
    const password = byId("password").value;
    const role = byId("role").value;

    if (!name || !email || !password) {
        alert("Заповніть всі поля.");
        return;
    }

    switch (role) {
        case "Admin":
            new Admin(name, email, password);
            break;
        case "Moderator":
            new Moderator(name, email, password);
            break;
        case "SuperAdmin":
            new SuperAdmin(name, email, password);
            break;
        default:
            new User(name, email, password);
    }

    e.target.reset();
    renderTable();
}

function init() {
    const form = byId("createUserForm");
    if (form) form.addEventListener("submit", onCreateUserSubmit);
    renderTable();
    setInterval(() => {
        if (users.some(isMutedNow)) renderTable();
    }, 1000);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
