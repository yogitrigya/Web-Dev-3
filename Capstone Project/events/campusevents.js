const EventEmitter = require('events');

class CampusEmitter extends EventEmitter {}
const campusEvents = new CampusEmitter();

let ioInstance = null;

const attachSocketIO = (io) => {
  ioInstance = io;
};

// Event 1: New Announcement Published -> Broadcast to target Socket.IO room
campusEvents.on('announcement:published', (announcement) => {
  console.log(
    `[EVENT] Announcement published (${announcement.scope}): "${announcement.title}"`
  );

  if (!ioInstance) return;

  if (announcement.scope === 'university') {
    ioInstance.to('university').emit('newAnnouncement', announcement);
  } else if (announcement.scope === 'section' && announcement.targetSection) {
    ioInstance
      .to(`section:${announcement.targetSection}`)
      .emit('newAnnouncement', announcement);
  } else if (announcement.scope === 'course' && announcement.targetCourse) {
    ioInstance
      .to(`course:${announcement.targetCourse}`)
      .emit('newAnnouncement', announcement);
  }
});

// Event 2: Attendance Marked/Updated -> Notify affected students in real time
campusEvents.on('attendance:updated', ({ courseCode, section, studentId, status, date }) => {
  console.log(
    `[EVENT] Attendance updated for student ${studentId} in ${courseCode} (${section}): ${status}`
  );

  if (ioInstance) {
    ioInstance.to(`user:${studentId}`).emit('attendanceAlert', {
      courseCode,
      section,
      status,
      date,
    });
  }
});

module.exports = { campusEvents, attachSocketIO };
