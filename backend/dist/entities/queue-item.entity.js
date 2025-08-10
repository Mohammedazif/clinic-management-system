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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueItem = exports.QueuePriority = exports.QueueStatus = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
const doctor_entity_1 = require("./doctor.entity");
var QueueStatus;
(function (QueueStatus) {
    QueueStatus["WAITING"] = "waiting";
    QueueStatus["CALLED"] = "called";
    QueueStatus["IN_CONSULTATION"] = "in_consultation";
    QueueStatus["COMPLETED"] = "completed";
    QueueStatus["CANCELLED"] = "cancelled";
    QueueStatus["NO_SHOW"] = "no_show";
})(QueueStatus || (exports.QueueStatus = QueueStatus = {}));
var QueuePriority;
(function (QueuePriority) {
    QueuePriority["LOW"] = "low";
    QueuePriority["NORMAL"] = "normal";
    QueuePriority["HIGH"] = "high";
    QueuePriority["URGENT"] = "urgent";
})(QueuePriority || (exports.QueuePriority = QueuePriority = {}));
let QueueItem = class QueueItem {
    get waitingTime() {
        if (this.status === QueueStatus.WAITING) {
            const now = new Date();
            const diffMs = now.getTime() - this.createdAt.getTime();
            return Math.floor(diffMs / (1000 * 60));
        }
        return 0;
    }
    get consultationDuration() {
        if (this.consultationStartedAt && this.consultationEndedAt) {
            const diffMs = this.consultationEndedAt.getTime() - this.consultationStartedAt.getTime();
            return Math.floor(diffMs / (1000 * 60));
        }
        return 0;
    }
    get isActive() {
        return [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_CONSULTATION].includes(this.status);
    }
};
exports.QueueItem = QueueItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QueueItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], QueueItem.prototype, "queueNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], QueueItem.prototype, "queueDate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], QueueItem.prototype, "patientName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_validator_1.IsPhoneNumber)(),
    __metadata("design:type", String)
], QueueItem.prototype, "patientPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], QueueItem.prototype, "patientAge", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: QueueStatus,
        default: QueueStatus.WAITING,
    }),
    __metadata("design:type", String)
], QueueItem.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: QueuePriority,
        default: QueuePriority.NORMAL,
    }),
    __metadata("design:type", String)
], QueueItem.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], QueueItem.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], QueueItem.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], QueueItem.prototype, "estimatedWaitTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], QueueItem.prototype, "calledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], QueueItem.prototype, "consultationStartedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], QueueItem.prototype, "consultationEndedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], QueueItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], QueueItem.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => doctor_entity_1.Doctor, { eager: true, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'doctorId' }),
    __metadata("design:type", doctor_entity_1.Doctor)
], QueueItem.prototype, "doctor", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], QueueItem.prototype, "doctorId", void 0);
exports.QueueItem = QueueItem = __decorate([
    (0, typeorm_1.Entity)('queue_items'),
    (0, typeorm_1.Index)(['queueNumber', 'queueDate'], { unique: true })
], QueueItem);
//# sourceMappingURL=queue-item.entity.js.map