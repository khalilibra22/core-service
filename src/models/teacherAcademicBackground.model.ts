export class TeacherAcademicBackground {
  id: number;
  teacherId: string;
  diploma: string;
  institution: string;
  yearObtained: number;

  constructor(
    id: number,
    teacherId: string,
    diploma: string,
    institution: string,
    yearObtained: number
  ) {
    this.id = id;
    this.teacherId = teacherId;
    this.diploma = diploma;
    this.institution = institution;
    this.yearObtained = yearObtained;
  }
}
