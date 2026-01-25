export const CACHE_KEYS = {
    COURSE: (id: string) => `course-${id}`,
    COURSE_ENROLLMENTS: (id: string) => `course-enrollments-${id}`,
    TEACHER_COURSES: (id: string, type: string, page: number, limit: number) => `teacher-courses-${id}-${type}-${page}-${limit}`,
    LIVE_COURSES: (page: number, limit: number) => `live-courses-${page}-${limit}`,
    GROUP_COURSES: (page: number, limit: number) => `group-courses-${page}-${limit}`,
    PRERECORDED_COURSES: (page: number, limit: number) => `prerecorded-courses-${page}-${limit}`,
    SESSION: (id: string) => `session-${id}`,
    COURSE_SESSIONS: (courseId: string) => `course-sessions-${courseId}`,
    LESSON: (id: string) => `lesson-${id}`,
    SESSION_LESSONS: (sessionId: string) => `session-lessons-${sessionId}`,
    PRERECORDED_SESSION: (id: string) => `prerecorded-session-${id}`,
    PRERECORDED_COURSE_SECTIONS: (id: string) => `prerecorded-course-sections-${id}`,
    ENROLLMENT: (id: string) => `enrollment-${id}`,
    STUDENT_COURSE_ENROLLMENTS: (id: string) => `student-course-enrollments-${id}`,
    STUDENT_ONE_ON_ONE_ENROLLMENTS: (id: string) => `student-one-on-one-enrollments-${id}`,
    TEACHER_ONE_ON_ONE_ENROLLMENTS: (id: string) => `teacher-one-on-one-enrollments-${id}`,
    TEACHER_ONE_ON_ONE_SESSIONS: (id: string) => `teacher-one-on-one-sessions-${id}`,
    ENROLLMENT_SESSIONS: (id: string) => `enrollment-sessions-${id}`,
};

export const CACHE_TTL = {
    STATIC_CONTENT: 300000, // 5 minutes
    FREQUENT_LOOKUP: 60000,  // 1 minute
};
