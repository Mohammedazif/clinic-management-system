"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const queue_service_1 = require("./queue.service");
const create_queue_item_dto_1 = require("./dto/create-queue-item.dto");
const update_queue_item_dto_1 = require("./dto/update-queue-item.dto");
const queue_item_entity_1 = require("../entities/queue-item.entity");
let QueueController = class QueueController {
    constructor(queueService) {
        this.queueService = queueService;
    }
    async create(createQueueItemDto) {
        return this.queueService.create(createQueueItemDto);
    }
    async findAll(status, doctorId, priority, activeOnly) {
        const filters = {
            status,
            doctorId,
            priority,
            activeOnly: activeOnly === 'true',
        };
        return this.queueService.findAll(filters);
    }
    async getStats() {
        return this.queueService.getQueueStats();
    }
    async getActiveQueue() {
        return this.queueService.getActiveQueue();
    }
    async getWaitingQueue() {
        return this.queueService.getWaitingQueue();
    }
    async findByQueueNumber(queueNumber) {
        return this.queueService.findByQueueNumber(parseInt(queueNumber));
    }
    async findOne(id) {
        return this.queueService.findOne(id);
    }
    async callNext(body) {
        return this.queueService.callNext(body.doctorId);
    }
    async update(id, updateQueueItemDto) {
        return this.queueService.update(id, updateQueueItemDto);
    }
    async updateStatus(id, body) {
        return this.queueService.updateStatus(id, body.status);
    }
    async assignDoctor(id, body) {
        return this.queueService.assignDoctor(id, body.doctorId);
    }
    async remove(id) {
        await this.queueService.remove(id);
        return { message: 'Queue item deleted successfully' };
    }
};
exports.QueueController = QueueController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_queue_item_dto_1.CreateQueueItemDto]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('doctorId')),
    __param(2, (0, common_1.Query)('priority')),
    __param(3, (0, common_1.Query)('activeOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "getActiveQueue", null);
__decorate([
    (0, common_1.Get)('waiting'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "getWaitingQueue", null);
__decorate([
    (0, common_1.Get)('number/:queueNumber'),
    __param(0, (0, common_1.Param)('queueNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "findByQueueNumber", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('call-next'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "callNext", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_queue_item_dto_1.UpdateQueueItemDto]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/assign-doctor'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "assignDoctor", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "remove", null);
exports.QueueController = QueueController = __decorate([
    (0, common_1.Controller)('queue'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [queue_service_1.QueueService])
], QueueController);
//# sourceMappingURL=queue.controller.js.map