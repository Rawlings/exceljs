import _ from '../utils/helpers/under-dash';
import type { Comment } from './cell';

export interface NoteModel {
  type: 'note';
  note: Comment;
}

export class Note {
  static DEFAULT_CONFIGS = {
    note: {
      margins: {
        insetmode: 'auto',
        inset: [0.13, 0.13, 0.25, 0.25],
      },
      protection: {
        locked: 'True',
        lockText: 'True',
      },
      editAs: 'absolute',
    },
  };

  note: string | Comment | undefined;

  constructor(note?: string | Comment) {
    this.note = note;
  }

  get model() {
    let value: NoteModel;
    if (typeof this.note === 'string') {
      value = {
        type: 'note',
        note: {
          texts: [
            {
              text: this.note,
            },
          ],
        },
      };
    } else {
      value = {
        type: 'note',
        note: this.note ?? {},
      };
    }
    // Suitable for all cell comments
    return _.deepMerge({}, Note.DEFAULT_CONFIGS, value) as NoteModel;
  }

  set model(value: NoteModel) {
    const { note } = value;
    const { texts } = note;
    if (texts?.length === 1 && Object.keys(texts[0]).length === 1) {
      this.note = texts[0].text;
    } else {
      this.note = note;
    }
  }

  static fromModel(model: NoteModel): Note {
    const note = new Note();
    note.model = model;
    return note;
  }
}

export default Note;
