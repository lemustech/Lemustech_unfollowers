(function() {
    'use strict';

    const CONFIG = {
        APP_NAME: "Lemustech Instagram Unfollowers",
        VERSION: "1.0.0",
        IG_APP_ID: "936619743392459", 
        QUERY_HASH: "3dec7e2c57367ef3da3d987d89f9dbc8",
        STORAGE_KEY: "lemustech_whitelist_data",
        BATCH_SIZE: 15,
        DELAYS: {
            ACTION_MIN: 2000, ACTION_MAX: 5000,
            BATCH_MIN: 120000, BATCH_MAX: 180000,
            SCAN: 1000
        }
    };

    const TourSystem = {
        steps: [
            {
                target: null, 
                title: "Bienvenido a Lemustech",
                text: "Herramienta de gestión profesional para Instagram. Analiza y gestiona tu audiencia con seguridad."
            },
            {
                target: '#btn-scan-trigger',
                title: "1. Motor de Análisis",
                text: "Inicia la conexión segura. El sistema comparará tus seguidores y seguidos para encontrar discrepancias."
            },
            {
                target: '#stats-panel',
                title: "2. Métricas",
                text: "Monitorea el progreso. 'Detectados' son los usuarios que no te siguen de vuelta."
            },
            {
                target: '#selection-controls',
                title: "3. Selección",
                text: "Usa 'Seleccionar Todo' para acciones masivas o 'Prueba Unitaria' para verificar el funcionamiento."
            },
            {
                target: '#action-panel',
                title: "4. Ejecución",
                text: "Inicia el proceso. El algoritmo incluye pausas aleatorias para proteger la cuenta."
            }
        ],
        currentStep: 0
    };

    const Utils = {
        getCookie: (name) => {
            try {
                const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                return match ? match[2] : null;
            } catch (e) { return null; }
        },
        getUserId: () => {
            let uid = Utils.getCookie('ds_user_id');
            if (uid) return uid;
            try {
                const ls = localStorage.getItem('ig_session');
                if (ls) {
                    const data = JSON.parse(ls);
                    if (data && data.user_id) return data.user_id;
                }
            } catch(e) {}
            return null;
        },
        sleep: (ms) => new Promise((resolve, reject) => {
            const id = setTimeout(() => resolve(), ms);
            if (state.abortController) {
                state.abortController.signal.addEventListener('abort', () => {
                    clearTimeout(id);
                    reject(new Error("Abortado"));
                });
            }
        }),
        randomDelay: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),
        formatTime: (ms) => {
            const min = Math.floor(ms / 60000);
            const sec = Math.floor((ms % 60000) / 1000);
            return `${min}m ${sec}s`;
        },
        saveWhitelist: (set) => localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify([...set])),
        loadWhitelist: () => {
            try {
                return new Set(JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]'));
            } catch (e) { return new Set(); }
        }
    };

    const STYLES = `
        :root{--bg-root:#0d1117;--bg-sidebar:#161b22;--bg-card:#21262d;--border-color:#30363d;--accent-color:#2f81f7;--accent-hover:#58a6ff;--danger-color:#da3633;--danger-hover:#f85149;--text-main:#c9d1d9;--text-muted:#8b949e;--font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
        html,body{overflow:hidden!important;width:100%;height:100%;margin:0;padding:0}
        #lemustech-root,#lemustech-root *{box-sizing:border-box}
        #lemustech-root{position:fixed;top:0;left:0;width:100vw;height:100vh;background-color:var(--bg-root);color:var(--text-main);font-family:var(--font-family);font-size:14px;z-index:2147483647;display:flex;opacity:0;animation:fadeIn 0.4s forwards}
        @keyframes fadeIn{to{opacity:1}}
        aside{width:300px;min-width:300px;flex-shrink:0;background-color:var(--bg-sidebar);border-right:1px solid var(--border-color);display:flex;flex-direction:column;padding:20px;gap:20px;overflow-y:auto;height:100%;transition:transform 0.3s ease;position:relative;z-index:20}
        .brand-area{padding-bottom:15px;border-bottom:1px solid var(--border-color);margin-bottom:5px}
        .brand-title{font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px;display:block}
        .brand-subtitle{font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px;display:block}
        .control-group{display:flex;flex-direction:column;gap:10px}
        .group-label{font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px}
        .stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .stat-card{background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:10px;text-align:center}
        .stat-value{display:block;font-size:24px;font-weight:700;color:#fff;line-height:1.2}
        .stat-desc{display:block;font-size:11px;color:var(--text-muted)}
        .btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px;border-radius:8px;border:none;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;color:#fff}
        .btn:disabled{opacity:0.5;cursor:not-allowed;filter:grayscale(1)}
        .btn:active{transform:scale(0.98)}
        .btn-primary{background-color:var(--accent-color)}
        .btn-primary:hover:not(:disabled){background-color:var(--accent-hover)}
        .btn-danger{background-color:var(--danger-color)}
        .btn-danger:hover:not(:disabled){background-color:var(--danger-hover)}
        .btn-ghost{background-color:transparent;border:1px solid var(--border-color);color:var(--text-main)}
        .btn-ghost:hover:not(:disabled){background-color:rgba(255,255,255,0.05);border-color:var(--text-muted)}
        .search-box{width:100%;background:#0d1117;border:1px solid var(--border-color);color:#fff;padding:10px 12px;border-radius:8px;outline:none;font-size:13px;transition:border 0.2s}
        .search-box:focus{border-color:var(--accent-color)}
        main{flex:1;display:flex;flex-direction:column;padding:25px;overflow-y:auto;overflow-x:hidden;position:relative}
        .user-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:15px;width:100%;padding-bottom:50px}
        .user-card{background:var(--bg-card);border:1px solid var(--border-color);border-radius:10px;padding:12px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden}
        .user-card:hover{border-color:var(--accent-color);transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.2)}
        .user-card.selected{background:rgba(47,129,247,0.1);border-color:var(--accent-color)}
        .user-card.whitelisted{opacity:0.6;border-color:#d29922;border-style:dashed}
        .avatar{width:48px;height:48px;border-radius:50%;background:#21262d;object-fit:cover;flex-shrink:0;border:2px solid var(--border-color)}
        .user-info{flex:1;min-width:0}
        .user-name{display:block;font-weight:700;color:#fff;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .user-sub{display:block;font-size:12px;color:var(--text-muted);margin-top:2px}
        .star-indicator{position:absolute;top:8px;right:8px;color:#d29922;font-size:14px;display:none}
        .user-card.whitelisted .star-indicator{display:block}
        .empty-view{margin:auto;text-align:center;color:var(--text-muted);display:flex;flex-direction:column;align-items:center;opacity:0.8}
        .empty-icon{font-size:48px;margin-bottom:15px}
        .overlay-loader{position:absolute;inset:0;background:rgba(13,17,23,0.95);display:none;flex-direction:column;align-items:center;justify-content:center;z-index:50;backdrop-filter:blur(5px)}
        .spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,0.1);border-top-color:var(--accent-color);border-radius:50%;animation:spin 1s infinite linear;margin-bottom:20px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .log-terminal{width:90%;max-width:500px;height:200px;background:#000;border:1px solid var(--border-color);border-radius:8px;padding:15px;font-family:monospace;font-size:12px;color:#8b949e;overflow-y:auto;margin-bottom:20px}
        .mobile-toggle{display:none;position:absolute;top:15px;left:15px;z-index:100;background:#21262d;border:1px solid #30363d;color:#fff;padding:8px 12px;border-radius:6px;font-size:20px;cursor:pointer}
        @media(max-width:768px){.mobile-toggle{display:block}aside{position:absolute;left:-100%;height:100%;width:85%;box-shadow:10px 0 50px rgba(0,0,0,0.8)}aside.open{left:0}main{padding:60px 15px 15px 15px}.user-grid{grid-template-columns:1fr}}
        .tour-highlight{position:fixed;border:2px solid var(--accent-color);border-radius:8px;box-shadow:0 0 0 9999px rgba(0,0,0,0.75);pointer-events:none;z-index:9998;transition:all 0.3s cubic-bezier(0.25,0.46,0.45,0.94)}
        .tour-tooltip{position:fixed;width:280px;background:var(--bg-card);border:1px solid var(--border-color);padding:20px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.5);z-index:10000;color:#fff;display:none;transition:all 0.3s ease}
        .tour-btn{float:right;margin-top:10px;padding:6px 12px;background:var(--accent-color);border:none;border-radius:6px;color:#fff;font-weight:600;cursor:pointer}
        .toast-startup{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--accent-color);color:#fff;padding:10px 20px;border-radius:50px;font-weight:600;z-index:1000000;box-shadow:0 5px 20px rgba(0,0,0,0.3);animation:fadeOut 5s forwards}
        @keyframes fadeOut{0%,80%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-20px);pointer-events:none}}
    `;

    const state = {
        users: [],
        selectedIds: new Set(),
        whitelist: Utils.loadWhitelist(),
        searchTerm: '',
        processing: false,
        scanning: false,
        abortController: null
    };

    const Client = {
        async fetch(url, options = {}) {
            const headers = { 'X-IG-App-ID': CONFIG.IG_APP_ID, 'X-Requested-With': 'XMLHttpRequest', ...options.headers };
            if (options.method === 'POST') {
                const csrf = Utils.getCookie('csrftoken');
                if (!csrf) throw new Error("Falta CSRF Token.");
                headers['X-CSRFToken'] = csrf;
            }
            try {
                const res = await fetch(url, { ...options, headers });
                if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
                return res;
            } catch (e) { throw e; }
        },
        async scan(logger) {
            const userId = Utils.getUserId();
            if (!userId) throw new Error("ID de usuario no encontrado.");
            let hasNext = true, cursor = null, count = 0, results = [];
            while (hasNext) {
                if (state.abortController?.signal.aborted) break;
                const vars = { id: userId, include_reel: true, fetch_mutual: false, first: 50, after: cursor };
                const params = new URLSearchParams({ query_hash: CONFIG.QUERY_HASH, variables: JSON.stringify(vars) });
                try {
                    const res = await this.fetch(`https://www.instagram.com/graphql/query/?${params}`);
                    const json = await res.json();
                    if (!json.data || !json.data.user) throw new Error("Datos inválidos de IG");
                    const edge = json.data.user.edge_follow;
                    hasNext = edge.page_info.has_next_page;
                    cursor = edge.page_info.end_cursor;
                    for (const { node } of edge.edges) {
                        count++;
                        if (node.follows_viewer === false) {
                            results.push({ id: node.id, username: node.username, fullName: node.full_name, avatar: node.profile_pic_url });
                        }
                    }
                    logger(`Escaneando... ${count} analizados`);
                    await Utils.sleep(Utils.randomDelay(500, 1000));
                } catch (e) {
                    logger(`Error de red: ${e.message}. Reintentando...`);
                    await Utils.sleep(2000);
                }
            }
            return results;
        },
        async unfollow(id) {
            try {
                const res = await this.fetch(`https://www.instagram.com/web/friendships/${id}/unfollow/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                });
                return res.ok;
            } catch { return false; }
        }
    };

    const h = (tag, cls, propsOrChildren, children) => {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        let props = {}, kids = [];
        const isProps = (arg) => arg && typeof arg === 'object' && !Array.isArray(arg) && !(arg instanceof Node);
        if (isProps(propsOrChildren)) { props = propsOrChildren; kids = children || []; } else { kids = propsOrChildren || []; }
        for (const [key, val] of Object.entries(props)) {
            if (key === 'style') Object.assign(el.style, val);
            else if (key.startsWith('on')) el[key.toLowerCase()] = val;
            else if (key === 'innerText') el.innerText = val;
            else el.setAttribute(key, val);
        }
        const append = (c) => c != null && (c instanceof Node ? el.appendChild(c) : el.appendChild(document.createTextNode(String(c))));
        Array.isArray(kids) ? kids.forEach(append) : append(kids);
        return el;
    };

    function initApp() {
        document.body.innerHTML = "";
        document.head.appendChild(h('style', '', STYLES));
        
        const elTotal = h('span', 'stat-value', '0');
        const elSel = h('span', 'stat-value', {style:{color: 'var(--accent-color)'}}, '0');
        const searchInput = h('input', 'search-box', { placeholder: 'Filtrar usuarios...' });
        
        const btnScan = h('button', 'btn btn-primary', { id: 'btn-scan-trigger' }, 'INICIAR ESCANEO');
        const btnAction = h('button', 'btn btn-danger', { id: 'btn-action-trigger', disabled: true }, 'DEJAR DE SEGUIR');
        const btnStop = h('button', 'btn btn-ghost', { style: {display:'none', color:'var(--danger-color)'} }, 'DETENER PROCESO');

        const sidebar = h('aside', '', [
            h('div', 'brand-area', [
                h('span', 'brand-title', CONFIG.APP_NAME),
                h('span', 'brand-subtitle', 'Management Suite')
            ]),
            h('div', 'control-group', [
                h('div', 'group-label', 'Búsqueda'),
                searchInput
            ]),
            h('div', 'control-group', {id: 'stats-panel'}, [
                h('div', 'group-label', 'Resumen'),
                h('div', 'stats-grid', [
                    h('div', 'stat-card', [h('span', 'stat-value', elTotal), h('span', 'stat-desc', 'Detectados')]),
                    h('div', 'stat-card', [h('span', 'stat-value', elSel), h('span', 'stat-desc', 'Selección')])
                ])
            ]),
            h('div', 'control-group', {id: 'selection-controls'}, [
                h('div', 'group-label', 'Herramientas'),
                h('button', 'btn btn-ghost', { onclick: () => { 
                    state.selectedIds.clear(); 
                    const u = state.users.find(x => !state.whitelist.has(x.id));
                    if(u) state.selectedIds.add(u.id);
                    render();
                }}, '🧪 Prueba Unitaria'),
                h('button', 'btn btn-ghost', { onclick: () => { 
                    state.users.forEach(x => { if(!state.whitelist.has(x.id)) state.selectedIds.add(x.id) });
                    render();
                }}, '⚡ Seleccionar Todo'),
                h('button', 'btn btn-ghost', { onclick: () => { 
                    state.selectedIds.clear(); render();
                }}, '❌ Deseleccionar')
            ]),
            h('div', 'control-group', { id: 'action-panel', style: { marginTop: 'auto' } }, [btnScan, btnAction]),
            h('button', 'btn btn-ghost', { style:{fontSize:'11px', opacity:'0.5'}, onclick: () => showTourStep(0)}, 'Ver Tutorial')
        ]);

        const mobileToggle = h('button', 'mobile-toggle', { onclick: () => sidebar.classList.toggle('open') }, '☰');

        const grid = h('div', 'user-grid');
        const emptyState = h('div', 'empty-view', [
            h('div', 'empty-icon', '📡'),
            h('h2', '', 'Listo para comenzar'),
            h('p', '', 'Presiona Iniciar Escaneo para cargar datos.')
        ]);
        
        const logBox = h('div', 'log-terminal');
        const loader = h('div', 'overlay-loader', [
            h('div', 'spinner'), 
            h('h3', {style:{color:'white', fontWeight:'600'}}, 'Procesando...'), 
            logBox, btnStop
        ]);

        const toast = h('div', 'toast-startup', '🚀 Sistema Cargado - Cierra la consola (F12)');

        const render = () => {
            grid.innerHTML = '';
            if (state.users.length === 0 && !state.scanning) {
                grid.replaceWith(emptyState);
            } else {
                if (emptyState.parentNode) emptyState.replaceWith(grid);
            }

            const frag = document.createDocumentFragment();
            let selCount = 0;
            const term = state.searchTerm.toLowerCase();

            state.users.forEach(u => {
                if (term && !u.username.toLowerCase().includes(term)) return;
                const isSel = state.selectedIds.has(u.id);
                if (isSel) selCount++;
                const isWhite = state.whitelist.has(u.id);

                const card = h('div', `user-card ${isSel?'selected':''} ${isWhite?'whitelisted':''}`);
                card.onclick = () => {
                    if (state.processing || isWhite) return;
                    state.selectedIds.has(u.id) ? state.selectedIds.delete(u.id) : state.selectedIds.add(u.id);
                    render();
                };

                const img = h('img', 'avatar', {src: u.avatar});
                img.onerror = function() { this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOGI5NDllIiBzdHJva2Utd2lkdGg9IjIiPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPjxwYXRoIGQ9Ik0yMCAyMWMtMS05LTEwLTktMTIgMCIvPjwvc3ZnPg=='; };

                const info = h('div', 'user-info', [
                    h('span', 'user-name', u.username),
                    h('span', 'user-sub', u.fullName || 'Instagram User')
                ]);
                
                card.append(img, info, h('span', 'star-indicator', '★'));
                frag.appendChild(card);
            });
            grid.appendChild(frag);
            
            elTotal.innerText = state.users.length;
            elSel.innerText = selCount;
            btnAction.innerText = `EJECUTAR (${selCount})`;
            btnAction.disabled = selCount === 0 || state.processing;
        };

        searchInput.oninput = (e) => { state.searchTerm = e.target.value; render(); };
        const log = (msg) => { logBox.prepend(h('div', '', `> ${msg}`)); };

        btnScan.onclick = async () => {
            sidebar.classList.remove('open');
            state.scanning = true;
            state.abortController = new AbortController();
            loader.style.display = 'flex';
            logBox.innerHTML = '';
            try {
                const res = await Client.scan(log);
                state.users = res;
                await Utils.sleep(500);
            } catch (e) { alert(e.message); } 
            finally {
                state.scanning = false;
                loader.style.display = 'none';
                render();
            }
        };

        btnAction.onclick = async () => {
            sidebar.classList.remove('open');
            if(!confirm(`Se van a eliminar ${state.selectedIds.size} usuarios.\n¿Deseas continuar?`)) return;
            state.processing = true;
            state.abortController = new AbortController();
            loader.style.display = 'flex';
            btnStop.style.display = 'block';
            logBox.innerHTML = '';

            const ids = Array.from(state.selectedIds);
            let processed = 0;

            try {
                for (const id of ids) {
                    if (state.abortController.signal.aborted) throw new Error("Cancelado por usuario");
                    if (processed > 0 && processed % CONFIG.BATCH_SIZE === 0) {
                        const wait = Utils.randomDelay(CONFIG.DELAYS.BATCH_MIN, CONFIG.DELAYS.BATCH_MAX);
                        log(`Enfriamiento: ${Utils.formatTime(wait)}`);
                        await Utils.sleep(wait);
                    }
                    const u = state.users.find(x => x.id === id);
                    log(`Eliminando: ${u?.username}`);
                    if (await Client.unfollow(id)) {
                        state.selectedIds.delete(id);
                        state.users = state.users.filter(x => x.id !== id);
                        processed++;
                    }
                    await Utils.sleep(Utils.randomDelay(2000, 4000));
                }
                alert("Proceso completado");
            } catch (e) { if(e.message !== "Cancelado por usuario") alert(e.message); } 
            finally {
                state.processing = false;
                loader.style.display = 'none';
                render();
            }
        };

        btnStop.onclick = () => state.abortController?.abort();

        const tourHighlight = h('div', 'tour-highlight', {style:{display:'none'}});
        const tourTooltip = h('div', 'tour-tooltip');
        
        const showTourStep = async (stepIdx) => {
            const step = TourSystem.steps[stepIdx];
            if(!step) {
                tourHighlight.style.display = 'none';
                tourTooltip.style.display = 'none';
                localStorage.setItem('lemustech_tour_done', 'true');
                return;
            }

            tourTooltip.innerHTML = '';
            tourTooltip.append(
                h('h3', {style:{margin:'0 0 10px 0', fontSize:'16px', fontWeight:'700', color: 'var(--accent-color)'}}, step.title),
                h('p', {style:{lineHeight:'1.5', fontSize:'13px', color:'#ccc'}}, step.text),
                h('button', 'tour-btn', {onclick:() => showTourStep(stepIdx+1)}, 'Siguiente')
            );

            if (step.target) {
                const el = document.querySelector(step.target);
                if (window.innerWidth < 768 && sidebar.contains(el)) {
                    sidebar.classList.add('open');
                    await Utils.sleep(350);
                }

                const rect = el.getBoundingClientRect();
                tourHighlight.style.display = 'block';
                tourHighlight.style.top = rect.top + 'px';
                tourHighlight.style.left = rect.left + 'px';
                tourHighlight.style.width = rect.width + 'px';
                tourHighlight.style.height = rect.height + 'px';

                tourTooltip.style.display = 'block';
                const tooltipW = 280;
                const tooltipH = 150;
                
                let left = rect.right + 20;
                let top = rect.top;

                if (left + tooltipW > window.innerWidth) {
                    left = rect.left - tooltipW - 20;
                    if (left < 20) { 
                        left = (window.innerWidth - tooltipW) / 2;
                        top = rect.bottom + 20;
                        if (top + tooltipH > window.innerHeight) top = rect.top - tooltipH - 20;
                    }
                }
                
                if (top + tooltipH > window.innerHeight) {
                    top = (rect.bottom - tooltipH);
                }

                tourTooltip.style.top = top + 'px';
                tourTooltip.style.left = left + 'px';

            } else {
                tourHighlight.style.display = 'none';
                tourTooltip.style.display = 'block';
                tourTooltip.style.top = '50%';
                tourTooltip.style.left = '50%';
                tourTooltip.style.transform = 'translate(-50%, -50%)';
            }
        };

        const app = h('div', '', {id: 'lemustech-root'}, [
            sidebar, 
            mobileToggle, 
            h('main', '', [emptyState]),
            loader,
            tourHighlight, 
            tourTooltip,
            toast
        ]);
        
        document.body.appendChild(app);

        if (!localStorage.getItem('lemustech_tour_done')) setTimeout(() => showTourStep(0), 1000);
    }

    try {
        console.clear();
        console.log(`%c ${CONFIG.APP_NAME} `, "background:#2f81f7;color:white;padding:4px 8px;border-radius:4px;");
        if (!Utils.getCookie('csrftoken')) {
            alert("⚠️ ALERTA: No se detectó la sesión de Instagram.\nPor favor, inicia sesión en tu cuenta y recarga la página.");
        } else {
            initApp();
        }
    } catch (e) {
        alert("Error crítico al iniciar: " + e.message);
    }

})();