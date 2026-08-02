import _ from '#src/utils/helpers/under-dash';

export interface NoteMargins {
  insetmode: 'auto' | 'custom';
  inset: number[];
}

export interface NoteProtection {
  locked: 'True' | 'False';
  lockText: 'True' | 'False';
}

export type NoteEditAs = 'twoCells' | 'oneCells' | 'absolute';

export interface NoteText {
  text: string;
}

export interface NoteObject {
  texts?: NoteText[];
  margins?: Partial<NoteMargins>;
  protection?: Partial<NoteProtection>;
  editAs?: NoteEditAs;
}

export type NoteValue = string | NoteObject;

export interface NoteModel {
  type: 'note';
  note: NoteObject;
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

  note: NoteValue | undefined;

  constructor(note?: NoteValue) {
    this.note = note;
  }

  get model(): NoteModel {
    let value: NoteModel;
    switch (typeof this.note) {
      case 'string':
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
        break;
      default:
        value = {
          type: 'note',
          note: this.note as NoteObject,
        };
        break;
    }
    // Suitable for all cell comments
    return _.deepMerge({}, Note.DEFAULT_CONFIGS, value);
  }

  set model(value: NoteModel) {
    const { note } = value;
    const { texts } = note;
    if (texts && texts.length === 1 && Object.keys(texts[0]).length === 1) {
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
