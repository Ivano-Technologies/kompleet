import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { FinancialStatementsService } from '@/lib/services/financial-statements-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { statementType, startDate, endDate, asOfDate } = body;

    if (!statementType) {
      return NextResponse.json({ error: 'statementType is required' }, { status: 400 });
    }

    // Fetch transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(id, name, category_type, tax_treatment)
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: true });

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let statement: any;
    let htmlContent: string;

    if (statementType === 'profit_loss') {
      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: 'startDate and endDate are required for P&L' },
          { status: 400 }
        );
      }
      statement = FinancialStatementsService.generateProfitLoss(
        transactions,
        startDate,
        endDate
      );
      htmlContent = generateProfitLossHTML(statement);
    } else if (statementType === 'balance_sheet') {
      if (!asOfDate) {
        return NextResponse.json(
          { error: 'asOfDate is required for Balance Sheet' },
          { status: 400 }
        );
      }
      statement = FinancialStatementsService.generateBalanceSheet(transactions, asOfDate);
      htmlContent = generateBalanceSheetHTML(statement);
    } else {
      return NextResponse.json({ error: 'Invalid statementType' }, { status: 400 });
    }

    // Return HTML for client-side PDF generation
    return NextResponse.json({ html: htmlContent });
  } catch (error: any) {
    console.error('Error in POST /api/reports/export-pdf:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateProfitLossHTML(statement: any): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; }
        h2 { margin-top: 30px; border-bottom: 1px solid #666; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        td { padding: 8px; }
        .amount { text-align: right; }
        .total { font-weight: bold; border-top: 2px solid #000; }
        .net-income { font-size: 1.2em; font-weight: bold; border-top: 3px solid #000; }
      </style>
    </head>
    <body>
      <h1>PROFIT & LOSS STATEMENT</h1>
      <p style="text-align: center;">
        For the period from ${formatDate(statement.period.start)} to ${formatDate(statement.period.end)}
      </p>

      <h2>REVENUE</h2>
      <table>
        ${statement.revenue.items.map((item: any) => `
          <tr>
            <td>${item.category}</td>
            <td class="amount">${formatCurrency(item.amount)}</td>
          </tr>
        `).join('')}
        <tr class="total">
          <td>TOTAL REVENUE</td>
          <td class="amount">${formatCurrency(statement.revenue.total)}</td>
        </tr>
      </table>

      <h2>EXPENSES</h2>
      <table>
        ${statement.expenses.items.map((item: any) => `
          <tr>
            <td>${item.category}</td>
            <td class="amount">${formatCurrency(item.amount)}</td>
          </tr>
        `).join('')}
        <tr class="total">
          <td>TOTAL EXPENSES</td>
          <td class="amount">${formatCurrency(statement.expenses.total)}</td>
        </tr>
      </table>

      <table>
        <tr class="net-income">
          <td>NET ${statement.netIncome >= 0 ? 'PROFIT' : 'LOSS'}</td>
          <td class="amount">${formatCurrency(Math.abs(statement.netIncome))}</td>
        </tr>
        <tr class="total">
          <td>TAXABLE INCOME</td>
          <td class="amount">${formatCurrency(statement.taxableIncome)}</td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function generateBalanceSheetHTML(statement: any): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; }
        h2 { margin-top: 30px; border-bottom: 2px solid #000; padding-bottom: 5px; }
        h3 { margin-top: 20px; border-bottom: 1px solid #666; padding-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        td { padding: 6px; }
        .amount { text-align: right; }
        .subtotal { font-weight: bold; border-top: 1px solid #666; }
        .total { font-weight: bold; font-size: 1.1em; border-top: 3px solid #000; }
      </style>
    </head>
    <body>
      <h1>BALANCE SHEET</h1>
      <p style="text-align: center;">As of ${formatDate(statement.period.asOf)}</p>

      <h2>ASSETS</h2>
      
      <h3>Current Assets</h3>
      <table>
        ${statement.assets.current.items.map((item: any) => `
          <tr>
            <td>${item.category}</td>
            <td class="amount">${formatCurrency(item.amount)}</td>
          </tr>
        `).join('')}
        <tr class="subtotal">
          <td>Total Current Assets</td>
          <td class="amount">${formatCurrency(statement.assets.current.total)}</td>
        </tr>
      </table>

      <h3>Non-Current Assets</h3>
      <table>
        ${statement.assets.nonCurrent.items.map((item: any) => `
          <tr>
            <td>${item.category}</td>
            <td class="amount">${formatCurrency(item.amount)}</td>
          </tr>
        `).join('')}
        <tr class="subtotal">
          <td>Total Non-Current Assets</td>
          <td class="amount">${formatCurrency(statement.assets.nonCurrent.total)}</td>
        </tr>
      </table>

      <table>
        <tr class="total">
          <td>TOTAL ASSETS</td>
          <td class="amount">${formatCurrency(statement.assets.total)}</td>
        </tr>
      </table>

      <h2>LIABILITIES & EQUITY</h2>
      
      <h3>Current Liabilities</h3>
      <table>
        ${statement.liabilities.current.items.map((item: any) => `
          <tr>
            <td>${item.category}</td>
            <td class="amount">${formatCurrency(item.amount)}</td>
          </tr>
        `).join('')}
        <tr class="subtotal">
          <td>Total Current Liabilities</td>
          <td class="amount">${formatCurrency(statement.liabilities.current.total)}</td>
        </tr>
      </table>

      <h3>Non-Current Liabilities</h3>
      <table>
        ${statement.liabilities.nonCurrent.items.map((item: any) => `
          <tr>
            <td>${item.category}</td>
            <td class="amount">${formatCurrency(item.amount)}</td>
          </tr>
        `).join('')}
        <tr class="subtotal">
          <td>Total Non-Current Liabilities</td>
          <td class="amount">${formatCurrency(statement.liabilities.nonCurrent.total)}</td>
        </tr>
      </table>

      <h3>Equity</h3>
      <table>
        ${statement.equity.items.map((item: any) => `
          <tr>
            <td>${item.category}</td>
            <td class="amount">${formatCurrency(item.amount)}</td>
          </tr>
        `).join('')}
        <tr class="subtotal">
          <td>Total Equity</td>
          <td class="amount">${formatCurrency(statement.equity.total)}</td>
        </tr>
      </table>

      <table>
        <tr class="total">
          <td>TOTAL LIABILITIES & EQUITY</td>
          <td class="amount">${formatCurrency(statement.totalLiabilitiesAndEquity)}</td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
