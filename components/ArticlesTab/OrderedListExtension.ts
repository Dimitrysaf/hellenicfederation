
import { OrderedList } from '@tiptap/extension-ordered-list';

export const OrderedListExtension = OrderedList.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {
        style: 'list-style-type: lower-greek; padding-left: 15px;',
        class: "order_class",
      },
    };
  },
});
