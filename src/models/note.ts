import _ from '#src/utils/helpers/under-dash';

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

  note: any;

  constructor(note?: any) {
    this.note = note;
  }

  get model() {
    let value = null;
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
          note: this.note,
        };
        break;
    }
    // Suitable for all cell comments
    return _.deepMerge({}, Note.DEFAULT_CONFIGS, value);
  }

  set model(value: any) {
    const { note } = value;
    const { texts } = note;
    if (texts && texts.length === 1 && Object.keys(texts[0]).length === 1) {
      this.note = texts[0].text;
    } else {
      this.note = note;
    }
  }

  static fromModel(model: any) {
    const note = new Note();
    note.model = model;
    return note;
  }
}

export default Note;
