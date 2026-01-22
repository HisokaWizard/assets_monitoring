/**
 * @fileoverview DTO для обновления актива.
 *
 * Этот файл определяет структуру данных для запросов на обновление существующих активов.
 * Использует PartialType из @nestjs/mapped-types для создания типа,
 * где все поля базового DTO становятся опциональными.
 *
 * Это позволяет обновлять только необходимые поля актива,
 * не требуя указания всех параметров.
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetDto } from './create-asset.dto';

/**
 * DTO для обновления актива.
 *
 * Наследуется от CreateAssetDto через PartialType, что делает все поля опциональными.
 * Это позволяет частично обновлять активы, изменяя только нужные свойства.
 *
 * PartialType - утилита NestJS, которая создает новый тип на основе существующего,
 * делая все его свойства опциональными (T | undefined).
 */
export class UpdateAssetDto extends PartialType(CreateAssetDto) {}
