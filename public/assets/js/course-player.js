// Reproductor Interactivo de Misiones en 5 Etapas y Evaluaciones (Quiz)
const CoursePlayer = {
    currentCourse: null,
    moduleIndex: 0,
    phase: 0,
    selectedOption: null,
    optionChecked: false,
    quizState: null,

    async startCourse(courseId, modIdx = 0) {
        Sound.playClick();
        try {
            const res = await API.getCourse(courseId);
            this.currentCourse = res.course;
            this.moduleIndex = modIdx;
            this.phase = 0;
            this.selectedOption = null;
            this.optionChecked = false;
            this.render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            toast('Error al cargar la misión formativa.', 'error');
        }
    },

    render() {
        const c = this.currentCourse;
        if (!c || !c.modules.length) {
            SPA.navigate('catalog');
            return;
        }

        const m = c.modules[this.moduleIndex];
        const phaseTitles = ['Descubre', 'Aprende', 'Practica', 'Demuestra', 'Desbloquea'];
        const symbols = ['🔎', '📖', '🎲', '🧪', '🏅'];
        const phase = this.phase;

        let phaseContent = '';

        if (phase === 0) {
            phaseContent = `
                <div class="reading-panel">
                    <span class="eyebrow">✨ Descubre tu misión</span>
                    <h2>Antes de empezar…</h2>
                    <blockquote style="font-size:15px; font-weight:750; color:var(--ink); margin:14px 0; border-left:4px solid var(--orange); padding-left:14px;">
                        “${m.story}”
                    </blockquote>
                    <p>Tu objetivo en esta misión es comprender el desafío del rol, aplicar los controles y preparar tu evidencia.</p>
                </div>
            `;
        } else if (phase === 1) {
            phaseContent = `
                <div class="reading-panel">
                    <span class="eyebrow">📖 Aprende</span>
                    <h2>${m.title}</h2>
                    <p style="font-size:13px; line-height:1.7;">${m.concept}</p>
                    <div class="card" style="background:#fff9ec; border:1px solid #ffe2b0; margin-top:16px;">
                        <strong>Regla de Oro A.L.O.:</strong> ¿Qué debes hacer? ¿Por qué importa para el cliente? ¿Cómo dejas evidencia trazable?
                    </div>
                </div>
            `;
        } else if (phase === 2) {
            const opts = m.practice_options || [];
            phaseContent = `
                <div class="reading-panel">
                    <span class="eyebrow">🎲 Practica · Microreto</span>
                    <h2>${m.practice_q}</h2>
                    <p>Selecciona la mejor decisión para este escenario:</p>
                    <div class="options-list">
                        ${opts.map((opt, i) => `
                            <button type="button" class="option-btn ${this.selectedOption === i ? 'selected' : ''}" onclick="CoursePlayer.selectOption(${i})">
                                <span class="option-letter">${String.fromCharCode(65 + i)}</span>
                                <span>${opt}</span>
                            </button>
                        `).join('')}
                    </div>
                    ${this.optionChecked ? `
                        <div class="card" style="margin-top:16px; background:${this.selectedOption === m.practice_answer ? '#e6f6ee' : '#fff1ee'}; border-color:${this.selectedOption === m.practice_answer ? '#bfe7d5' : '#fed4ce'};">
                            <strong>${this.selectedOption === m.practice_answer ? '✅ ¡Decisión Correcta!' : '💡 Oportunidad de Aprendizaje'}</strong>
                            <p style="margin:5px 0 0;">${m.practice_feedback}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        } else if (phase === 3) {
            phaseContent = `
                <div class="reading-panel">
                    <span class="eyebrow">🧪 Demuestra</span>
                    <h2>Transforma lo aprendido en una acción concreta</h2>
                    <p>${m.reflection}</p>
                    <label class="form-field" style="margin-top:12px;">
                        <span style="font-weight:900; font-size:11px;">Tu reflexión o acción aplicada:</span>
                        <textarea id="reflection-input" class="textarea" rows="4" placeholder="Escribe aquí tu compromiso o evidencia...">${m.user_reflection || ''}</textarea>
                    </label>
                </div>
            `;
        } else if (phase === 4) {
            phaseContent = `
                <div class="reading-panel" style="text-align:center; padding:32px;">
                    <div style="font-size:54px;">🏆</div>
                    <h2>¡Misión Superada!</h2>
                    <p>Has completado satisfactoriamente los pasos formativos de esta etapa.</p>
                    <div class="mini-badge gold" style="font-size:14px; padding:10px 18px; margin:14px auto;">
                        🌟 +70 Puntos de Experiencia (XP)
                    </div>
                </div>
            `;
        }

        const root = document.getElementById('page-root');
        root.innerHTML = `
            <div class="page-head">
                <div>
                    <span class="eyebrow">🎮 Misión en Curso · ${c.type}</span>
                    <h1 style="margin:0">${c.title}</h1>
                    <p>${m.subtitle} · ${m.estimated} min estimados</p>
                </div>
                <button class="btn btn-outline" onclick="SPA.navigate('${c.type === 'Onboarding' ? 'onboarding' : 'catalog'}')">← Salir a Rutas</button>
            </div>

            <div class="course-shell">
                <div>
                    <div class="phase-nav">
                        ${phaseTitles.map((title, i) => `
                            <button class="phase-btn ${i === phase ? 'current' : (i < phase ? 'passed' : '')}" onclick="CoursePlayer.jumpPhase(${i})" ${i > phase ? 'disabled' : ''}>
                                ${symbols[i]} ${title}
                            </button>
                        `).join('')}
                    </div>

                    ${phaseContent}

                    <div style="display:flex; justify-content:space-between; margin-top:20px;">
                        <button class="btn btn-outline" onclick="CoursePlayer.prevPhase()" ${phase === 0 ? 'disabled' : ''}>← Anterior</button>
                        <div>
                            ${phase === 2 && !this.optionChecked ? `<button class="btn btn-primary" onclick="CoursePlayer.checkOption()">Comprobar Decisión →</button>` : ''}
                            ${phase === 2 && this.optionChecked ? `<button class="btn btn-primary" onclick="CoursePlayer.nextPhase()">Continuar →</button>` : ''}
                            ${phase !== 2 && phase < 4 ? `<button class="btn btn-primary" onclick="CoursePlayer.nextPhase()">Continuar →</button>` : ''}
                            ${phase === 4 ? `
                                <button class="btn btn-primary" onclick="CoursePlayer.finishCurrentModule()">
                                    ✓ Finalizar Misión y Sumar XP
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <aside>
                    <div class="card" style="margin-bottom:16px;">
                        <div class="card-header">
                            <h3>🗺️ Mapa de la Ruta</h3>
                            <span class="mini-badge orange">${c.progress?.percentage || 0}%</span>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${c.modules.map((mod, i) => `
                                <div style="display:flex; align-items:center; gap:10px; padding:10px; border-radius:10px; border:1px solid ${i === this.moduleIndex ? 'var(--orange)' : 'var(--line)'}; background:${i === this.moduleIndex ? '#fff8f2' : '#fff'}; cursor:pointer;" onclick="CoursePlayer.startCourse('${c.id}', ${i})">
                                    <span>${mod.completed ? '✅' : (i === this.moduleIndex ? '▶️' : '🎮')}</span>
                                    <div style="font-size:11px;">
                                        <b>${mod.title}</b>
                                        <div style="font-size:9px; color:var(--muted);">${mod.subtitle}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="card">
                        <h3>🧩 Desafío Final</h3>
                        <p style="font-size:11px; color:var(--muted);">Al superar los módulos de esta ruta, desbloqueas el reto evaluativo para certificar tu logro.</p>
                        <button class="btn btn-outline btn-wide" onclick="CoursePlayer.startQuiz('${c.id}')">Presentar Evaluación →</button>
                    </div>
                </aside>
            </div>
        `;
    },

    selectOption(index) {
        Sound.playClick();
        this.selectedOption = index;
        this.optionChecked = false;
        this.render();
    },

    checkOption() {
        if (this.selectedOption === null) {
            toast('Selecciona una opción primero.', 'error');
            return;
        }
        const m = this.currentCourse.modules[this.moduleIndex];
        if (this.selectedOption === m.practice_answer) {
            Sound.playSuccess();
        } else {
            Sound.playError();
        }
        this.optionChecked = true;
        this.render();
    },

    jumpPhase(p) {
        Sound.playClick();
        this.phase = p;
        this.render();
    },

    nextPhase() {
        Sound.playClick();
        if (this.phase === 3) {
            const txt = document.getElementById('reflection-input')?.value || '';
            this.currentCourse.modules[this.moduleIndex].user_reflection = txt;
        }
        this.phase = Math.min(4, this.phase + 1);
        this.render();
    },

    prevPhase() {
        Sound.playClick();
        this.phase = Math.max(0, this.phase - 1);
        this.render();
    },

    async finishCurrentModule() {
        const m = this.currentCourse.modules[this.moduleIndex];
        const reflection = m.user_reflection || '';

        try {
            Sound.playCoin();
            const res = await API.completeModule(m.id, reflection);
            Sound.playSuccess();
            toast(res.message, 'success');
            
            // Avanzar al siguiente módulo o a evaluaciones
            if (this.moduleIndex < this.currentCourse.modules.length - 1) {
                this.startCourse(this.currentCourse.id, this.moduleIndex + 1);
            } else {
                toast('¡Ruta completada! Presenta tu evaluación final para obtener tu constancia.', 'success');
                this.startQuiz(this.currentCourse.id);
            }
        } catch (e) {
            Sound.playError();
            toast('Error al registrar misión completada.', 'error');
        }
    },

    async startQuiz(courseId) {
        Sound.playClick();
        try {
            const res = await API.getCourse(courseId);
            const questions = res.course.questions || [];
            if (!questions.length) {
                toast('Este curso aún no tiene preguntas de evaluación.', 'error');
                return;
            }

            this.quizState = {
                course: res.course,
                questions: questions,
                currentIndex: 0,
                answers: {} // {questionId: selectedIndex}
            };
            this.renderQuiz();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            toast('Error al iniciar evaluación.', 'error');
        }
    },

    renderQuiz() {
        const qState = this.quizState;
        const q = qState.questions[qState.currentIndex];
        const total = qState.questions.length;
        const currentNum = qState.currentIndex + 1;

        const root = document.getElementById('page-root');
        root.innerHTML = `
            <div class="page-head">
                <div>
                    <span class="eyebrow">🧩 RETO EVALUATIVO · UMBRAL ≥80%</span>
                    <h1 style="margin:0">${qState.course.title}</h1>
                    <p>Pregunta ${currentNum} de ${total} · Sin errores críticos</p>
                </div>
                <button class="btn btn-outline" onclick="SPA.navigate('evaluations')">Salir del Reto</button>
            </div>

            <div class="course-shell">
                <div class="card" style="padding:28px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                        <span class="mini-badge ${q.critical ? 'red' : 'blue'}">
                            ${q.critical ? '🛡️ PREGUNTA DE CONTROL CRÍTICO' : '🎯 PREGUNTA DE CONOCIMIENTO'}
                        </span>
                        <span style="font-weight:800; font-size:11px;">Pregunta ${currentNum}/${total}</span>
                    </div>

                    <div class="progress-track" style="margin-bottom:20px;">
                        <div class="progress-fill" style="width:${(currentNum/total)*100}%;"></div>
                    </div>

                    <h2 style="font-size:18px; margin-bottom:20px;">${q.text}</h2>

                    <div class="options-list">
                        ${q.options.map((opt, i) => `
                            <button type="button" class="option-btn ${qState.answers[q.id] === i ? 'selected' : ''}" onclick="CoursePlayer.selectQuizAnswer('${q.id}', ${i})">
                                <span class="option-letter">${String.fromCharCode(65 + i)}</span>
                                <span>${opt}</span>
                            </button>
                        `).join('')}
                    </div>

                    <div style="display:flex; justify-content:space-between; margin-top:26px;">
                        <button class="btn btn-outline" onclick="CoursePlayer.prevQuizQuestion()" ${qState.currentIndex === 0 ? 'disabled' : ''}>← Anterior</button>
                        ${currentNum === total ? `
                            <button class="btn btn-primary" onclick="CoursePlayer.submitQuiz()">
                                🚀 Entregar y Calificar Reto
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="CoursePlayer.nextQuizQuestion()">
                                Siguiente Pregunta →
                            </button>
                        `}
                    </div>
                </div>

                <aside>
                    <div class="card">
                        <h3>Tablero de Respuestas</h3>
                        <p style="font-size:11px; color:var(--muted);">Preguntas respondidas: ${Object.keys(qState.answers).length} de ${total}</p>
                        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; margin-top:12px;">
                            ${qState.questions.map((ques, idx) => `
                                <div style="padding:8px; border-radius:8px; text-align:center; font-weight:850; font-size:11px; border:1px solid ${qState.answers[ques.id] !== undefined ? 'var(--green)' : 'var(--line)'}; background:${qState.answers[ques.id] !== undefined ? '#e6f6ee' : '#fff'};">
                                    ${idx + 1}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </aside>
            </div>
        `;
    },

    selectQuizAnswer(questionId, optionIndex) {
        Sound.playClick();
        this.quizState.answers[questionId] = optionIndex;
        this.renderQuiz();
    },

    nextQuizQuestion() {
        Sound.playClick();
        this.quizState.currentIndex = Math.min(this.quizState.questions.length - 1, this.quizState.currentIndex + 1);
        this.renderQuiz();
    },

    prevQuizQuestion() {
        Sound.playClick();
        this.quizState.currentIndex = Math.max(0, this.quizState.currentIndex - 1);
        this.renderQuiz();
    },

    async submitQuiz() {
        const qState = this.quizState;
        if (Object.keys(qState.answers).length < qState.questions.length) {
            toast('Por favor responde todas las preguntas antes de entregar.', 'error');
            return;
        }

        try {
            Sound.playClick();
            const res = await API.submitQuiz(qState.course.id, qState.answers);
            if (res.passed) {
                Sound.playSuccess();
            } else {
                Sound.playError();
            }
            this.renderQuizResult(res);
        } catch (e) {
            toast('Error al calificar la evaluación.', 'error');
        }
    },

    renderQuizResult(res) {
        const root = document.getElementById('page-root');
        root.innerHTML = `
            <div class="card" style="max-width:680px; margin:40px auto; text-align:center; padding:44px 34px;">
                <div style="font-size:60px;">${res.passed ? '🏆' : '🧩'}</div>
                <h1 style="font-size:32px; color:${res.passed ? 'var(--green)' : 'var(--orange-hot)'}; margin:12px 0;">
                    ${res.score}%
                </h1>
                <h2>${res.passed ? '¡Desafío Superado!' : 'Oportunidad de Refuerzo'}</h2>
                <p style="font-size:13px; color:var(--muted); line-height:1.6; max-width:500px; margin:0 auto 20px;">
                    ${res.message}
                </p>

                ${res.certificate ? `
                    <div class="card" style="background:#fff8ee; border:2px dashed #e6b163; margin:20px auto; padding:18px;">
                        <span class="mini-badge gold">🎓 CERTIFICADO DESBLOQUEADO</span>
                        <div style="font-size:15px; font-weight:900; margin:8px 0;">Folio: ${res.certificate.certificate_code}</div>
                        <button class="btn btn-primary" onclick="CoursePlayer.showCertificate('${res.certificate.certificate_code}')">
                            📜 Ver e Imprimir Certificado
                        </button>
                    </div>
                ` : ''}

                <div style="display:flex; justify-content:center; gap:12px; margin-top:24px;">
                    <button class="btn btn-outline" onclick="CoursePlayer.startQuiz('${this.quizState.course.id}')">Repetir Reto</button>
                    <button class="btn btn-primary" onclick="SPA.navigate('evaluations')">Ver Mis Calificaciones</button>
                </div>
            </div>
        `;
    },

    async showCertificate(code) {
        Sound.playClick();
        try {
            const res = await API.verifyCertificate(code);
            const cert = res.certificate;
            const root = document.getElementById('page-root');
            root.innerHTML = `
                <div class="certificate-container">
                    <div class="cert-actions" style="margin-bottom:12px;">
                        <button class="btn btn-primary" onclick="window.print()">🖨️ Imprimir Diploma</button>
                        <button class="btn btn-outline" onclick="SPA.navigate('badges')">← Volver a Mis Logros</button>
                    </div>

                    <div class="cert-card">
                        <div class="cert-header">
                            <span class="cert-kicker">ESCUELA A.L.O. · ALÓ CREDIT</span>
                            <div class="cert-title">CONSTANCIA DE FORMACIÓN</div>
                            <div class="cert-subtitle">Programa de Formación, Onboarding y Competencias Operativas</div>
                        </div>

                        <p>Se otorga el presente reconocimiento oficial a:</p>
                        <div class="cert-user">${cert.user_name}</div>
                        
                        <p style="margin-top:16px;">Por haber completado y acreditado con éxito la ruta formativa de:</p>
                        <div class="cert-ribbon">${cert.course_title}</div>

                        <div class="cert-meta">
                            <span><b>Canal:</b> ${cert.channel_code?.toUpperCase()}</span>
                            <span><b>Fecha de Emisión:</b> ${cert.issue_date.split(' ')[0]}</span>
                            <span class="cert-code-badge">FOLIO: ${cert.certificate_code}</span>
                        </div>

                        <div class="cert-foot">
                            Certificado emitido digitalmente por la Escuela de Formación y Talento A.L.O. · Aló Credit 2026.<br>
                            Válido para constancia formativa interna y habilitación de ruta.
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            toast('Error al consultar el certificado.', 'error');
        }
    }
};
