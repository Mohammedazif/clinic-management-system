"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateQueueItemDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_queue_item_dto_1 = require("./create-queue-item.dto");
class UpdateQueueItemDto extends (0, mapped_types_1.PartialType)(create_queue_item_dto_1.CreateQueueItemDto) {
}
exports.UpdateQueueItemDto = UpdateQueueItemDto;
//# sourceMappingURL=update-queue-item.dto.js.map