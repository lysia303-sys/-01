/**
 * LOCAL STORAGE & STATE MANAGEMENT WITH PERMANENT DISK PERSISTENCE
 * Junior High School Classroom Management System (v2.1)
 */

function formatClassKhmer(cls) {
  if (!cls) return "ថ្នាក់ទី ៨ A";
  if (cls.includes("ថ្នាក់ទី")) return cls;
  const khmerDigits = { "0": "០", "1": "១", "2": "២", "3": "៣", "4": "៤", "5": "៥", "6": "៦", "7": "៧", "8": "៨", "9": "៩" };
  const num = cls.replace(/[^0-9]/g, "").split("").map(d => khmerDigits[d] || d).join("");
  const letter = cls.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (num && letter) return `ថ្នាក់ទី ${num} ${letter}`;
  if (num) return `ថ្នាក់ទី ${num}`;
  return `ថ្នាក់ទី ${cls}`;
}

function formatClassShortKhmer(cls) {
  return formatClassKhmer(cls).replace("ថ្នាក់ទី ", "");
}

if (typeof window !== "undefined") {
  window.formatClassKhmer = formatClassKhmer;
  window.formatClassShortKhmer = formatClassShortKhmer;
}

const STORAGE_KEYS = {
  SCHOOL: "kh_school_info_v1",
  STUDENTS: "kh_students_v1",
  SUBJECTS: "kh_subjects_v1",
  GRADES: "kh_grades_v1",
  ATTENDANCE: "kh_attendance_v1",
  DISCIPLINE: "kh_discipline_v1",
  TIMETABLE: "kh_timetable_v1",
  HOMEWORK: "kh_homework_v1",
  QUESTIONS: "kh_questions_v1",
  TEXTBOOKS: "kh_textbooks_v1",
  COUNCIL: "kh_council_v1",
  CLUBS: "kh_clubs_v1",
  SEATING: "kh_seating_v1",
  HEALTH: "kh_health_v1",
  ELECTIONS: "kh_elections_v1",
  GAMIFICATION: "kh_gamification_v1",
  FUND: "kh_fund_v1",
  LOGBOOK: "kh_logbook_v1",
  RESOURCES: "kh_resources_v1",
  THEME: "kh_app_theme_v1",
  CURRENT_CLASS: "kh_current_class_v1"
};

class StorageManager {
  static init() {
    // 1. If server injected __SERVER_DB__, apply it immediately and synchronously
    if (typeof window !== "undefined" && window.__SERVER_DB__ && typeof window.__SERVER_DB__ === "object" && Object.keys(window.__SERVER_DB__).length > 0) {
      this.applyDatabase(window.__SERVER_DB__);
    } else {
      // 2. If no server DB injected, check if localStorage already has data; if not, initialize with seed defaults (do NOT overwrite server!)
      if (!localStorage.getItem(STORAGE_KEYS.SCHOOL)) {
        this.resetToDefaults(false);
      }
    }

    // 3. Sync from server via fetch API in case server updated
    this.syncFromServer();
  }

  static applyDatabase(db) {
    if (!db || typeof db !== "object") return;
    const syncKey = (storageKey, val) => {
      if (val !== undefined && val !== null) {
        localStorage.setItem(storageKey, JSON.stringify(val));
      }
    };
    syncKey(STORAGE_KEYS.SCHOOL, db.school);
    syncKey(STORAGE_KEYS.STUDENTS, db.students);
    syncKey(STORAGE_KEYS.SUBJECTS, db.subjects);
    syncKey(STORAGE_KEYS.GRADES, db.grades);
    syncKey(STORAGE_KEYS.ATTENDANCE, db.attendance);
    syncKey(STORAGE_KEYS.DISCIPLINE, db.discipline);
    syncKey(STORAGE_KEYS.TIMETABLE, db.timetable);
    syncKey(STORAGE_KEYS.HOMEWORK, db.homework);
    syncKey(STORAGE_KEYS.QUESTIONS, db.questions);
    syncKey(STORAGE_KEYS.TEXTBOOKS, db.textbooks);
    syncKey(STORAGE_KEYS.COUNCIL, db.council);
    syncKey(STORAGE_KEYS.CLUBS, db.clubs);
    syncKey(STORAGE_KEYS.SEATING, db.seating);
    syncKey(STORAGE_KEYS.HEALTH, db.health);
    syncKey(STORAGE_KEYS.ELECTIONS, db.elections);
    syncKey(STORAGE_KEYS.GAMIFICATION, db.gamification);
    syncKey(STORAGE_KEYS.FUND, db.fund);
    syncKey(STORAGE_KEYS.LOGBOOK, db.logbook);
    syncKey(STORAGE_KEYS.RESOURCES, db.resources);
  }

  /**
   * Syncs data from server's database.json file so that edits persist across
   * all browsers, ports, localhost/127.0.0.1, and system restarts.
   */
  static async syncFromServer() {
    if (typeof window === "undefined" || !window.location || !window.location.protocol.startsWith("http")) return;
    try {
      const res = await fetch("/api/data");
      if (!res.ok) return;
      const db = await res.json();
      if (!db || typeof db !== "object") return;

      let changed = false;
      const syncKey = (storageKey, serverValue) => {
        if (serverValue !== undefined && serverValue !== null) {
          const str = JSON.stringify(serverValue);
          if (localStorage.getItem(storageKey) !== str) {
            localStorage.setItem(storageKey, str);
            changed = true;
          }
        }
      };

      syncKey(STORAGE_KEYS.SCHOOL, db.school);
      syncKey(STORAGE_KEYS.STUDENTS, db.students);
      syncKey(STORAGE_KEYS.SUBJECTS, db.subjects);
      syncKey(STORAGE_KEYS.GRADES, db.grades);
      syncKey(STORAGE_KEYS.ATTENDANCE, db.attendance);
      syncKey(STORAGE_KEYS.DISCIPLINE, db.discipline);
      syncKey(STORAGE_KEYS.TIMETABLE, db.timetable);
      syncKey(STORAGE_KEYS.HOMEWORK, db.homework);
      syncKey(STORAGE_KEYS.QUESTIONS, db.questions);
      syncKey(STORAGE_KEYS.TEXTBOOKS, db.textbooks);
      syncKey(STORAGE_KEYS.COUNCIL, db.council);
      syncKey(STORAGE_KEYS.CLUBS, db.clubs);
      syncKey(STORAGE_KEYS.SEATING, db.seating);
      syncKey(STORAGE_KEYS.HEALTH, db.health);
      syncKey(STORAGE_KEYS.ELECTIONS, db.elections);
      syncKey(STORAGE_KEYS.GAMIFICATION, db.gamification);
      syncKey(STORAGE_KEYS.FUND, db.fund);
      syncKey(STORAGE_KEYS.LOGBOOK, db.logbook);
      syncKey(STORAGE_KEYS.RESOURCES, db.resources);

      if (changed && window.App && typeof window.App.refreshAllModules === "function") {
        window.App.refreshAllModules();
      }
    } catch (e) {
      // Offline fallback: continue with localStorage
    }
  }

  /**
   * Automatically persists any changed data to the server's database.json
   */
  static saveToServer(key, data) {
    if (typeof window !== "undefined" && window.location && window.location.protocol.startsWith("http")) {
      try {
        fetch("/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, data })
        }).catch(() => {});
      } catch (e) {}
    }
  }

  static resetToDefaults(syncToServer = false) {
    localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(SEED_SCHOOL_INFO));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(SEED_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(SEED_SUBJECTS));
    
    // Seed initial grades for Month 10 & 09
    const initialGrades = {
      "month_10": SEED_MONTH_10_GRADES,
      "month_11": {},
      "month_12": {},
      "sem_1": {},
      "month_01": {},
      "month_02": {},
      "month_03": {},
      "month_04": {},
      "month_05": {},
      "sem_2": {}
    };
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(initialGrades));

    // Seed initial attendance
    const today = new Date().toISOString().split('T')[0];
    const initialAttendance = {};
    initialAttendance[today] = {};
    SEED_STUDENTS.forEach((st, idx) => {
      if (idx === 7) {
        initialAttendance[today][st.id] = { status: "A", note: "ឈឺផ្ដាសាយធ្ងន់ធ្ងរ" };
      } else if (idx === 19) {
        initialAttendance[today][st.id] = { status: "L", note: "សុំច្បាប់ការងារគ្រួសារ" };
      } else {
        initialAttendance[today][st.id] = { status: "P", note: "" };
      }
    });
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(initialAttendance));

    localStorage.setItem(STORAGE_KEYS.DISCIPLINE, JSON.stringify(SEED_DISCIPLINE_RECORDS));
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(SEED_TIMETABLE));
    localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(SEED_HOMEWORK));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(typeof SEED_QUESTIONS !== "undefined" ? SEED_QUESTIONS : []));
    localStorage.setItem(STORAGE_KEYS.TEXTBOOKS, JSON.stringify(typeof SEED_TEXTBOOKS !== "undefined" ? SEED_TEXTBOOKS : []));
    localStorage.setItem(STORAGE_KEYS.COUNCIL, JSON.stringify(typeof SEED_COUNCIL !== "undefined" ? SEED_COUNCIL : {}));
    localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(typeof SEED_CLUBS !== "undefined" ? SEED_CLUBS : []));
    localStorage.setItem(STORAGE_KEYS.HEALTH, JSON.stringify(typeof SEED_HEALTH_RECORDS !== "undefined" ? SEED_HEALTH_RECORDS : {}));
    localStorage.setItem(STORAGE_KEYS.ELECTIONS, JSON.stringify(typeof SEED_ELECTIONS !== "undefined" ? SEED_ELECTIONS : []));
    localStorage.setItem(STORAGE_KEYS.GAMIFICATION, JSON.stringify(typeof SEED_GAMIFICATION !== "undefined" ? SEED_GAMIFICATION : {}));
    localStorage.setItem(STORAGE_KEYS.FUND, JSON.stringify(typeof SEED_FUND !== "undefined" ? SEED_FUND : {}));
    localStorage.setItem(STORAGE_KEYS.LOGBOOK, JSON.stringify(typeof SEED_LOGBOOK !== "undefined" ? SEED_LOGBOOK : []));
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(typeof SEED_RESOURCES !== "undefined" ? SEED_RESOURCES : []));
    localStorage.setItem(STORAGE_KEYS.CURRENT_CLASS, "8A");

    // Sync reset to server ONLY when explicitly requested (e.g. Settings reset button)
    if (syncToServer) {
      this.saveToServer("allData", {
        school: SEED_SCHOOL_INFO,
        students: SEED_STUDENTS,
        subjects: SEED_SUBJECTS,
        grades: initialGrades,
        attendance: initialAttendance,
        discipline: SEED_DISCIPLINE_RECORDS,
        timetable: SEED_TIMETABLE,
        homework: SEED_HOMEWORK,
        questions: typeof SEED_QUESTIONS !== "undefined" ? SEED_QUESTIONS : [],
        textbooks: typeof SEED_TEXTBOOKS !== "undefined" ? SEED_TEXTBOOKS : [],
        council: typeof SEED_COUNCIL !== "undefined" ? SEED_COUNCIL : {},
        clubs: typeof SEED_CLUBS !== "undefined" ? SEED_CLUBS : [],
        health: typeof SEED_HEALTH_RECORDS !== "undefined" ? SEED_HEALTH_RECORDS : {},
        elections: typeof SEED_ELECTIONS !== "undefined" ? SEED_ELECTIONS : [],
        gamification: typeof SEED_GAMIFICATION !== "undefined" ? SEED_GAMIFICATION : {},
        fund: typeof SEED_FUND !== "undefined" ? SEED_FUND : {},
        logbook: typeof SEED_LOGBOOK !== "undefined" ? SEED_LOGBOOK : [],
        resources: typeof SEED_RESOURCES !== "undefined" ? SEED_RESOURCES : [],
        seating: []
      });
    }
  }

  static getSchoolInfo() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHOOL)) || SEED_SCHOOL_INFO;
  }

  static saveSchoolInfo(data) {
    localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(data));
    this.saveToServer("school", data);
  }

  static getCurrentClass() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CLASS) || 
           this.getSchoolInfo().currentClass || 
           "8A";
  }

  static setCurrentClass(cls) {
    if (!cls) return;
    localStorage.setItem(STORAGE_KEYS.CURRENT_CLASS, cls);
    const school = this.getSchoolInfo();
    school.currentClass = cls;
    this.saveSchoolInfo(school);
  }

  static getAcademicYear() {
    return this.getSchoolInfo().academicYear || "២០២៥-២០២៦";
  }

  static setAcademicYear(year) {
    if (!year) return;
    const school = this.getSchoolInfo();
    school.academicYear = year;
    this.saveSchoolInfo(school);
  }

  static getStudentsForClass(targetClass = null) {
    const all = this.getStudents();
    const cls = targetClass || this.getCurrentClass();
    if (!cls || cls === "all") return all;

    const normalizedT = cls.replace(/\s+/g, "").toUpperCase();
    const matched = all.filter(s => {
      if (!s.class) return false;
      const normalizedS = s.class.replace(/\s+/g, "").toUpperCase();
      return normalizedS === normalizedT || 
             s.class === formatClassKhmer(cls) || 
             s.class === formatClassShortKhmer(cls);
    });

    // If no students match specific class tag, but all students are in DB without class tag and active class is 8A
    if (matched.length === 0 && all.length > 0 && all.every(s => !s.class) && normalizedT === "8A") {
      return all;
    }

    return matched;
  }

  static getStudents() {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS));
    if (raw === null || raw === undefined) {
      return SEED_STUDENTS;
    }
    if (!Array.isArray(raw)) return [];
    
    // Return exact saved student list, preserving all user edits, additions, and deletions
    return raw.map(st => ({
      ...st,
      parentName: st.parentName || st.fatherName || st.motherName || "",
      parentPhone: st.parentPhone || "",
      address: st.address || "",
      pob: st.pob || ""
    }));
  }

  static saveStudents(students) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    this.saveToServer("students", students);
  }

  static getSubjects() {
    let subs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS));
    if (!subs || !Array.isArray(subs) || subs.length === 0) return SEED_SUBJECTS;

    // Ensure home_eco (គេហវិទ្យា) is included if missing
    const hasHomeEco = subs.some(s => s.id === "home_eco" || (s.nameKh && s.nameKh.includes("គេហវិទ្យា")) || (s.name && s.name.includes("គេហវិទ្យា")));
    if (!hasHomeEco) {
      const defaultHomeEco = (typeof SEED_SUBJECTS !== "undefined" ? SEED_SUBJECTS.find(s => s.id === "home_eco") : null) || {
        id: "home_eco",
        name: "គេហវិទ្យា",
        nameKh: "គេហវិទ្យា",
        nameEn: "Home Economics",
        maxScore: 50,
        coef: 1,
        teacher: "អ្នកគ្រូ ឡុង ស្រីពៅ",
        color: "#ec4899",
        phone: "០១២ ៣៤៥ ៦៨០"
      };
      subs.push(defaultHomeEco);
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subs));
      this.saveToServer("subjects", subs);
    }
    return subs;
  }

  static saveSubjects(subjects) {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    this.saveToServer("subjects", subjects);
  }

  static getGrades() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GRADES)) || {};
  }

  static saveGrades(grades) {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
    this.saveToServer("grades", grades);
  }

  static getAttendance() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || {};
  }

  static saveAttendance(attendance) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    this.saveToServer("attendance", attendance);
  }

  static getDiscipline() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DISCIPLINE)) || [];
  }

  static saveDiscipline(records) {
    localStorage.setItem(STORAGE_KEYS.DISCIPLINE, JSON.stringify(records));
    this.saveToServer("discipline", records);
  }

  static getTimetable() {
    let tt = JSON.parse(localStorage.getItem(STORAGE_KEYS.TIMETABLE));
    if (!tt || !Array.isArray(tt) || tt.length === 0) return SEED_TIMETABLE.filter(s => !s.isBreak);
    
    // Filter out break slots
    tt = tt.filter(s => !s.isBreak);

    const hasAfternoon = tt.some(s => s.shift === 'afternoon' || (s.time && parseInt(s.time.split(':')[0], 10) >= 12));
    if (!hasAfternoon && typeof SEED_TIMETABLE !== "undefined") {
      const afternoonSlots = SEED_TIMETABLE.filter(s => s.shift === 'afternoon' && !s.isBreak);
      tt = [...tt.map(s => ({ ...s, shift: s.shift || 'morning' })), ...afternoonSlots];
    }
    return tt;
  }

  static saveTimetable(timetable) {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
    this.saveToServer("timetable", timetable);
  }

  static getHomework() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HOMEWORK)) || (typeof SEED_HOMEWORK !== "undefined" ? SEED_HOMEWORK : []);
  }

  static saveHomework(homework) {
    localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(homework));
    this.saveToServer("homework", homework);
  }

  static getQuestions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS)) || (typeof SEED_QUESTIONS !== "undefined" ? SEED_QUESTIONS : []);
  }

  static saveQuestions(questions) {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    this.saveToServer("questions", questions);
  }

  static getTextbooks() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TEXTBOOKS)) || (typeof SEED_TEXTBOOKS !== "undefined" ? SEED_TEXTBOOKS : []);
  }

  static saveTextbooks(textbooks) {
    localStorage.setItem(STORAGE_KEYS.TEXTBOOKS, JSON.stringify(textbooks));
    this.saveToServer("textbooks", textbooks);
  }

  static getCouncil() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COUNCIL)) || (typeof SEED_COUNCIL !== "undefined" ? SEED_COUNCIL : {});
  }

  static saveCouncil(council) {
    localStorage.setItem(STORAGE_KEYS.COUNCIL, JSON.stringify(council));
    this.saveToServer("council", council);
  }

  static getClubs() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLUBS)) || (typeof SEED_CLUBS !== "undefined" ? SEED_CLUBS : []);
  }

  static saveClubs(clubs) {
    localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(clubs));
    this.saveToServer("clubs", clubs);
  }

  static getSeating() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SEATING)) || null;
  }

  static saveSeating(seating) {
    localStorage.setItem(STORAGE_KEYS.SEATING, JSON.stringify(seating));
    this.saveToServer("seating", seating);
  }

  static getHealth() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HEALTH)) || (typeof SEED_HEALTH_RECORDS !== "undefined" ? SEED_HEALTH_RECORDS : {});
  }

  static saveHealth(health) {
    localStorage.setItem(STORAGE_KEYS.HEALTH, JSON.stringify(health));
    this.saveToServer("health", health);
  }

  static getElections() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ELECTIONS)) || (typeof SEED_ELECTIONS !== "undefined" ? SEED_ELECTIONS : []);
  }

  static saveElections(elections) {
    localStorage.setItem(STORAGE_KEYS.ELECTIONS, JSON.stringify(elections));
    this.saveToServer("elections", elections);
  }

  static getGamification() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMIFICATION)) || (typeof SEED_GAMIFICATION !== "undefined" ? SEED_GAMIFICATION : { badges: [], studentStars: {}, history: [] });
  }

  static saveGamification(gamification) {
    localStorage.setItem(STORAGE_KEYS.GAMIFICATION, JSON.stringify(gamification));
    this.saveToServer("gamification", gamification);
  }

  static getFund() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FUND)) || (typeof SEED_FUND !== "undefined" ? SEED_FUND : { currency: "KHR", transactions: [] });
  }

  static saveFund(fund) {
    localStorage.setItem(STORAGE_KEYS.FUND, JSON.stringify(fund));
    this.saveToServer("fund", fund);
  }

  static getLogbook() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGBOOK)) || (typeof SEED_LOGBOOK !== "undefined" ? SEED_LOGBOOK : []);
  }

  static saveLogbook(logbook) {
    localStorage.setItem(STORAGE_KEYS.LOGBOOK, JSON.stringify(logbook));
    this.saveToServer("logbook", logbook);
  }

  static getResources() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RESOURCES)) || (typeof SEED_RESOURCES !== "undefined" ? SEED_RESOURCES : []);
  }

  static saveResources(resources) {
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
    this.saveToServer("resources", resources);
  }

  static exportBackupJSON() {
    const backup = {
      school: this.getSchoolInfo(),
      students: this.getStudents(),
      subjects: this.getSubjects(),
      grades: this.getGrades(),
      attendance: this.getAttendance(),
      discipline: this.getDiscipline(),
      timetable: this.getTimetable(),
      homework: this.getHomework(),
      questions: this.getQuestions(),
      textbooks: this.getTextbooks(),
      council: this.getCouncil(),
      clubs: this.getClubs(),
      seating: this.getSeating(),
      exportDate: new Date().toISOString(),
      version: "2.1"
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ថ្នាក់ទី_៨A_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static importBackupJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.students && Array.isArray(data.students)) {
        if (data.school) this.saveSchoolInfo(data.school);
        if (data.students) this.saveStudents(data.students);
        if (data.grades) this.saveGrades(data.grades);
        if (data.attendance) this.saveAttendance(data.attendance);
        if (data.discipline) this.saveDiscipline(data.discipline);
        if (data.homework) this.saveHomework(data.homework);
        if (data.questions) this.saveQuestions(data.questions);
        if (data.textbooks) this.saveTextbooks(data.textbooks);
        if (data.council) this.saveCouncil(data.council);
        if (data.clubs) this.saveClubs(data.clubs);
        if (data.seating) this.saveSeating(data.seating);
        return { success: true };
      }
      return { success: false, error: "ទម្រង់ឯកសារ JSON មិនត្រឹមត្រូវ" };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

// Auto init on load
StorageManager.init();
