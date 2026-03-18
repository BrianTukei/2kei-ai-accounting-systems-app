const mongoose = require('mongoose');

/**
 * Transaction Controller
 * Handles CRUD operations for transactions
 */
class TransactionController {
  /**
   * Get user's transactions with pagination and filtering
   * GET /api/transactions
   */
  async getTransactions(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        category, 
        status,
        startDate,
        endDate,
        sortBy = 'transactionDate',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;
      
      // Build query
      const query = { company: req.user.company };
      
      if (type) query.type = type;
      if (category) query.category = category;
      if (status) query.status = status;
      
      // Date range filter
      if (startDate || endDate) {
        query.transactionDate = {};
        if (startDate) query.transactionDate.$gte = new Date(startDate);
        if (endDate) query.transactionDate.$lte = new Date(endDate);
      }

      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get transactions and count
      const [transactions, total] = await Promise.all([
        mongoose.model('Transaction').find(query)
          .populate('createdBy', 'firstName lastName email')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        mongoose.model('Transaction').countDocuments(query)
      ]);

      return res.status(200).json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions'
      });
    }
  }

  /**
   * Create new transaction
   * POST /api/transactions
   */
  async createTransaction(req, res) {
    try {
      const Transaction = mongoose.model('Transaction');
      const { validationResult } = require('express-validator');
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const transactionData = {
        ...req.body,
        company: req.user.company,
        createdBy: req.user._id,
        transactionId: this.generateTransactionId()
      };

      // Handle currency conversion if needed
      if (req.body.amount.currency.code !== req.user.company.baseCurrency.code) {
        const forexService = require('../services/forexService');
        try {
          const conversion = await forexService.convert(
            req.body.amount.value,
            req.body.amount.currency.code,
            req.user.company.baseCurrency.code
          );
          
          transactionData.exchangeRate = {
            rate: conversion.rate,
            baseCurrency: req.body.amount.currency.code,
            targetCurrency: req.user.company.baseCurrency.code,
            convertedAmount: conversion.convertedAmount,
            rateDate: new Date()
          };
        } catch (error) {
          console.error('Currency conversion error:', error);
          // Continue without conversion if forex service fails
        }
      }

      const transaction = new Transaction(transactionData);
      await transaction.save();

      // Populate user info for response
      await transaction.populate('createdBy', 'firstName lastName email');

      return res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: { transaction }
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create transaction'
      });
    }
  }

  /**
   * Get transaction by ID
   * GET /api/transactions/:id
   */
  async getTransactionById(req, res) {
    try {
      const { id } = req.params;
      const Transaction = mongoose.model('Transaction');

      const transaction = await Transaction.findOne({
        _id: id,
        company: req.user.company
      }).populate('createdBy', 'firstName lastName email');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: { transaction }
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction'
      });
    }
  }

  /**
   * Update transaction
   * PUT /api/transactions/:id
   */
  async updateTransaction(req, res) {
    try {
      const { id } = req.params;
      const Transaction = mongoose.model('Transaction');
      const { validationResult } = require('express-validator');

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const transaction = await Transaction.findOne({
        _id: id,
        company: req.user.company
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Update transaction
      Object.assign(transaction, req.body);
      await transaction.save();

      await transaction.populate('createdBy', 'firstName lastName email');

      return res.status(200).json({
        success: true,
        message: 'Transaction updated successfully',
        data: { transaction }
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update transaction'
      });
    }
  }

  /**
   * Delete transaction
   * DELETE /api/transactions/:id
   */
  async deleteTransaction(req, res) {
    try {
      const { id } = req.params;
      const Transaction = mongoose.model('Transaction');

      const transaction = await Transaction.findOne({
        _id: id,
        company: req.user.company
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      await Transaction.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete transaction'
      });
    }
  }

  /**
   * Get transaction summary and statistics
   * GET /api/transactions/summary
   */
  async getTransactionSummary(req, res) {
    try {
      const Transaction = mongoose.model('Transaction');
      const { startDate, endDate } = req.query;

      // Build date filter
      const dateFilter = { company: req.user.company };
      if (startDate || endDate) {
        dateFilter.transactionDate = {};
        if (startDate) dateFilter.transactionDate.$gte = new Date(startDate);
        if (endDate) dateFilter.transactionDate.$lte = new Date(endDate);
      }

      // Get summary statistics
      const [
        totalIncome,
        totalExpenses,
        transactionCount,
        categoryBreakdown
      ] = await Promise.all([
        // Total income
        Transaction.aggregate([
          { $match: { ...dateFilter, type: 'income' } },
          { $group: { _id: null, total: { $sum: '$amount.value' } } }
        ]),
        // Total expenses
        Transaction.aggregate([
          { $match: { ...dateFilter, type: 'expense' } },
          { $group: { _id: null, total: { $sum: '$amount.value' } } }
        ]),
        // Transaction count by type
        Transaction.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        // Category breakdown
        Transaction.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$amount.value' } } },
          { $sort: { total: -1 } }
        ])
      ]);

      const income = totalIncome[0]?.total || 0;
      const expenses = totalExpenses[0]?.total || 0;
      const profit = income - expenses;

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalIncome: income,
            totalExpenses: expenses,
            profit: profit,
            profitMargin: income > 0 ? (profit / income) * 100 : 0
          },
          transactionCount: transactionCount,
          categoryBreakdown
        }
      });
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction summary'
      });
    }
  }

  /**
   * Get transaction categories
   * GET /api/transactions/categories
   */
  async getCategories(req, res) {
    try {
      const categories = {
        income: [
          { value: 'sales', label: 'Sales' },
          { value: 'services', label: 'Services' },
          { value: 'interest', label: 'Interest' },
          { value: 'rental', label: 'Rental Income' },
          { value: 'refund', label: 'Refund' },
          { value: 'other_income', label: 'Other Income' }
        ],
        expense: [
          { value: 'rent', label: 'Rent' },
          { value: 'utilities', label: 'Utilities' },
          { value: 'salaries', label: 'Salaries' },
          { value: 'marketing', label: 'Marketing' },
          { value: 'office_supplies', label: 'Office Supplies' },
          { value: 'software', label: 'Software' },
          { value: 'travel', label: 'Travel' },
          { value: 'meals', label: 'Meals' },
          { value: 'insurance', label: 'Insurance' },
          { value: 'taxes', label: 'Taxes' },
          { value: 'professional_fees', label: 'Professional Fees' },
          { value: 'equipment', label: 'Equipment' },
          { value: 'other_expense', label: 'Other Expense' }
        ],
        transfer: [
          { value: 'internal_transfer', label: 'Internal Transfer' },
          { value: 'loan_payment', label: 'Loan Payment' }
        ]
      };

      return res.status(200).json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch categories'
      });
    }
  }

  /**
   * Generate unique transaction ID
   * @private
   */
  generateTransactionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TXN-${timestamp}-${random}`.toUpperCase();
  }
}

module.exports = new TransactionController();
