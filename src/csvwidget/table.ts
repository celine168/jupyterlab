// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import * as dsv from 'd3-dsv';

import {
  clearSignalData, defineSignal, ISignal
} from 'phosphor/lib/core/signaling';

import {
  h, VNode
} from 'phosphor/lib/ui/vdom';

import {
  VDomModel, VDomWidget
} from '../common/vdom';

import {
  HTML_COMMON_CLASS
} from '../renderers/widget';


/**
 * The class name added to a csv table widget.
 */
const CSV_TABLE_CLASS = 'jp-CSVTable';

/**
 * The hard limit on the number of rows to display.
 */
const DISPLAY_LIMIT = 1000;


/**
 * A CSV table content model.
 */
export
class CSVModel extends VDomModel {
  /**
   * Instantiate a CSV model.
   */
  constructor(options: CSVModel.IOptions = {}) {
    super();
    this._content = options.content;
    this._delimiter = options.delimiter || ',';
  }

  /**
   * A signal emitted when the parsed value's rows exceed the display limit. It
   * emits the length of the parsed value.
   */
  readonly maxExceeded: ISignal<this, CSVModel.IOverflow>;

  /**
   * The raw model content.
   */
  get content(): string {
    return this._content;
  }
  set content(content: string) {
    if (this._content === content) {
      return;
    }
    this._content = content;
    this.stateChanged.emit(void 0);
  }

  /**
   * The CSV delimiter value.
   */
  get delimiter(): string {
    return this._delimiter;
  }
  set delimiter(delimiter: string) {
    if (this._delimiter === delimiter) {
      return;
    }
    this._delimiter = delimiter;
    this.stateChanged.emit(void 0);
  }

  /**
   * Dispose this model.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    super.dispose();
    clearSignalData(this);
  }

  /**
   * Parse the content using the model's delimiter.
   *
   * #### Notes
   * This method will always return parsed content that has at most the display
   * limit worth of rows, currently maxing out at 1000 rows.
   */
  parse(): dsv.DSVParsedArray<dsv.DSVRowString> {
    let output = dsv.dsvFormat(this._delimiter).parse(this._content);
    if (output.length > DISPLAY_LIMIT) {
      output.splice(0, DISPLAY_LIMIT);
      this.maxExceeded.emit({
        available: output.length,
        maximum: DISPLAY_LIMIT
      });
    }
    return output;
  }

  private _content: string = '';
  private _delimiter: string = '';
}


// Define the signals for the `CSVModel` class.
defineSignal(CSVModel.prototype, 'maxExceeded');


/**
 * A namespace for `CSVModel` statics.
 */
export
namespace CSVModel {
  /**
   * The value emitted when there are more data rows than what can be displayed.
   */
  export
  interface IOverflow {
    /**
     * The actual number of rows in the data.
     */
    available: number;

    /**
     * The maximum number of items that can be displayed.
     */
    maximum: number;
  }

  /**
   * Instantiation options for CSV models.
   */
  export
  interface IOptions {
    /**
     * The raw model content.
     */
    content?: string;

    /**
     * The CSV delimiter value.
     *
     * #### Notes
     * If this value is not set, it defaults to `','`.
     */
    delimiter?: string;
  }
}

/**
 * A CSV table content widget.
 */
export
class CSVTable extends VDomWidget<CSVModel> {
  /**
   * Instantiate a new CSV table widget.
   */
  constructor() {
    super();
    this.addClass(CSV_TABLE_CLASS);
    this.addClass(HTML_COMMON_CLASS);
  }

  /**
   * Render the content as virtual DOM nodes.
   */
  protected render(): VNode | VNode[] {
    let rows = this.model.parse();
    let cols = rows.columns || [];
    return h.table([
      h.thead(cols.map(col => h.th(col))),
      h.tbody(rows.map(row => h.tr(cols.map(col => h.td(row[col])))))
    ]);
  }
}
