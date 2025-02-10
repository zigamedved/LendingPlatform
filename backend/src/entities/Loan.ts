import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Loan {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  borrower: string;

  @Column()
  collateralToken: string;

  @Column()
  loanToken: string;

  @Column("float")
  collateralAmount: number;

  @Column("float")
  loanAmount: number;

  @Column("float")
  interestRate: number;

  @Column()
  dueDate: string;

  @Column()
  liquidated: boolean;
}