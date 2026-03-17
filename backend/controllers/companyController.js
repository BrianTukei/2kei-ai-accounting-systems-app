const Company = require('../models/Company');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Company Controller
 * Handles company onboarding, CRUD operations, and company-related functionality
 */
class CompanyController {
  /**
   * Create a new company (Onboarding)
   * POST /api/company
   */
  async createCompany(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const {
        name,
        legalName,
        registrationNumber,
        taxId,
        vatNumber,
        email,
        phone,
        website,
        address,
        baseCurrency,
        timezone,
        dateFormat,
        industry,
        businessType,
        logo,
        brandColors
      } = req.body;

      // Check if user already has a company
      const existingCompany = await Company.findOne({ owner: userId });
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'User already has a company. Use update endpoint instead.'
        });
      }

      // Create company with proper currency configuration
      const companyData = {
        name,
        legalName: legalName || name,
        registrationNumber,
        taxId,
        vatNumber,
        email,
        phone,
        website,
        address: {
          street: address?.street,
          city: address?.city,
          state: address?.state,
          postalCode: address?.postalCode,
          country: address?.country
        },
        baseCurrency: {
          code: baseCurrency?.code || 'USD',
          symbol: baseCurrency?.symbol || '$',
          name: baseCurrency?.name || 'US Dollar'
        },
        supportedCurrencies: [
          {
            code: baseCurrency?.code || 'USD',
            symbol: baseCurrency?.symbol || '$',
            name: baseCurrency?.name || 'US Dollar',
            isActive: true
          }
        ],
        timezone: timezone || 'UTC',
        dateFormat: dateFormat || 'MM/DD/YYYY',
        industry: industry || 'other',
        businessType: businessType || 'sole_proprietorship',
        logo,
        brandColors: {
          primary: brandColors?.primary || '#3B82F6',
          secondary: brandColors?.secondary || '#10B981'
        },
        owner: userId,
        members: [{ user: userId, role: 'admin' }]
      };

      const company = await Company.create(companyData);

      // Update user with company reference
      await User.findByIdAndUpdate(userId, { company: company._id });

      logger.info(`Company created: ${company.name} (ID: ${company._id}) by user ${userId}`);

      return res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: {
          company: {
            id: company._id,
            name: company.name,
            email: company.email,
            baseCurrency: company.baseCurrency,
            address: company.address
          }
        }
      });
    } catch (error) {
      logger.error('Error creating company:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create company',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get current user's company
   * GET /api/company
   */
  async getCompany(req, res) {
    try {
      const userId = req.user.id;

      const company = await Company.findOne({
        $or: [
          { owner: userId },
          { 'members.user': userId }
        ]
      }).populate('owner', 'firstName lastName email');

      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found. Please complete onboarding.'
        });
      }

      return res.status(200).json({
        success: true,
        data: { company }
      });
    } catch (error) {
      logger.error('Error fetching company:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch company',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update company details
   * PUT /api/company/:id
   */
  async updateCompany(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // Find company and check ownership
      const company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      // Check if user has permission (owner or admin)
      const userRole = company.getUserRole(userId);
      if (!userRole || userRole === 'viewer') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this company'
        });
      }

      // Prevent changing owner
      delete updates.owner;

      // Update company
      const updatedCompany = await Company.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      logger.info(`Company updated: ${updatedCompany.name} (ID: ${id}) by user ${userId}`);

      return res.status(200).json({
        success: true,
        message: 'Company updated successfully',
        data: { company: updatedCompany }
      });
    } catch (error) {
      logger.error('Error updating company:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update company',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Add member to company
   * POST /api/company/:id/members
   */
  async addMember(req, res) {
    try {
      const { id } = req.params;
      const { email, role } = req.body;
      const userId = req.user.id;

      const company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      // Check if user is admin
      const userRole = company.getUserRole(userId);
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can add members'
        });
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found with this email'
        });
      }

      // Check if already a member
      if (company.isMember(user._id)) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this company'
        });
      }

      // Check plan limits
      const memberCount = company.members.length;
      // Note: Actual limit check should be done against subscription

      // Add member
      company.members.push({
        user: user._id,
        role: role || 'viewer',
        joinedAt: new Date()
      });

      await company.save();

      // Update user's company reference
      await User.findByIdAndUpdate(user._id, { company: company._id });

      logger.info(`Member added to company ${id}: ${user.email} as ${role}`);

      return res.status(200).json({
        success: true,
        message: 'Member added successfully',
        data: {
          member: {
            id: user._id,
            email: user.email,
            name: user.fullName,
            role: role || 'viewer'
          }
        }
      });
    } catch (error) {
      logger.error('Error adding member:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add member',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Remove member from company
   * DELETE /api/company/:id/members/:userId
   */
  async removeMember(req, res) {
    try {
      const { id, userId: memberId } = req.params;
      const userId = req.user.id;

      const company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      // Check if user is admin or removing themselves
      const userRole = company.getUserRole(userId);
      if (userRole !== 'admin' && userId !== memberId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }

      // Prevent removing owner
      if (company.owner.toString() === memberId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove company owner'
        });
      }

      // Remove member
      company.members = company.members.filter(
        m => m.user.toString() !== memberId
      );

      await company.save();

      // Remove company reference from user
      await User.findByIdAndUpdate(memberId, { $unset: { company: 1 } });

      logger.info(`Member removed from company ${id}: ${memberId}`);

      return res.status(200).json({
        success: true,
        message: 'Member removed successfully'
      });
    } catch (error) {
      logger.error('Error removing member:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove member',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update company settings (currency, timezone, etc.)
   * PUT /api/company/:id/settings
   */
  async updateSettings(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { baseCurrency, timezone, dateFormat, numberFormat, aiSettings } = req.body;

      const company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      // Check permissions
      const userRole = company.getUserRole(userId);
      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }

      const updates = {};
      if (baseCurrency) updates.baseCurrency = baseCurrency;
      if (timezone) updates.timezone = timezone;
      if (dateFormat) updates.dateFormat = dateFormat;
      if (numberFormat) updates.numberFormat = numberFormat;
      if (aiSettings) updates.aiSettings = aiSettings;

      const updatedCompany = await Company.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      );

      logger.info(`Company settings updated: ${id}`);

      return res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: { settings: updatedCompany }
      });
    } catch (error) {
      logger.error('Error updating settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update settings',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new CompanyController();
