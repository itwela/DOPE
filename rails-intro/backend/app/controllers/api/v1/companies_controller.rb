class Api::V1::CompaniesController < ApplicationController
  before_action :set_company, only: [:show, :update, :destroy]

  # GET /api/v1/companies
  def index
    @companies = Company.all
    render json: @companies
  end

  # GET /api/v1/companies/:id
  def show
    render json: @company
  end

  # POST /api/v1/companies
  def create
    @company = Company.new(company_params)

    if @company.save
      render json: {
        status: { code: 201, message: 'Company created successfully.' },
        data: @company
      }, status: :created
    else
      render json: {
        status: { message: "Company couldn't be created successfully. #{@company.errors.full_messages.to_sentence}" }
      }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/companies/:id
  def update
    if @company.update(company_params)
      render json: {
        status: { code: 200, message: 'Company updated successfully.' },
        data: @company
      }
    else
      render json: {
        status: { message: "Company couldn't be updated successfully. #{@company.errors.full_messages.to_sentence}" }
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/companies/:id
  def destroy
    if @company.destroy
      render json: {
        status: { code: 200, message: 'Company deleted successfully.' }
      }
    else
      render json: {
        status: { message: "Company couldn't be deleted successfully. #{@company.errors.full_messages.to_sentence}" }
      }, status: :unprocessable_entity
    end
  end

  private

  def set_company
    @company = Company.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      status: { code: 404, message: 'Company not found.' }
    }, status: :not_found
  end

  def company_params
    params.require(:company).permit(:name, :website, :bigsender, :location, :weather_data)
  end
end
