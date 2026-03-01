# sub_task_1: Создать сущность ReportLog

## Описание

Создать новую TypeORM-сущность `ReportLog` в папке `notifications/reports/`.
Таблица `report_log` хранит историю отправленных периодических отчётов для обеспечения уникальности.

## Реализация

**Файл:** `backend/src/notifications/reports/report-log.entity.ts`

```typescript
@Entity()
export class ReportLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  period: string; // 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

  @Column({ type: 'datetime' })
  sentAt: Date;

  @Column({ default: 'sent' })
  status: string; // 'sent' | 'failed'
}
```

**Регистрация в модуле:** добавить `TypeOrmModule.forFeature([ReportLog])` в `reports.module.ts`
и `ReportLog` в `app.module.ts` entities (или synchronize:true подхватит автоматически).

## Тесткейсы для TDD

### TC-1: Entity создаётся корректно
```
Arrange: подготовить ReportLog с userId=1, period='daily', sentAt=new Date()
Assert: объект имеет все поля, period принимает все 5 значений
```

### TC-2: Поля nullable/required
```
Assert: userId — required (не null), period — required, sentAt — required
Assert: status имеет default 'sent'
```

## Ожидаемый результат

- Файл `report-log.entity.ts` создан
- `reports.module.ts` обновлён с TypeOrmModule.forFeature([..., ReportLog])
- Таблица `report_log` создаётся при старте (synchronize:true)

## Критерии приёмки

- Entity содержит все необходимые поля
- Зарегистрирована в модуле
- TypeScript strict не даёт ошибок
