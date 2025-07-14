# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

puts "Seeding companies..."

# Big Senders
Company.find_or_create_by!(name: "The Pittsburgh Roofer") do |company|
  company.website = "https://www.thepittsburghroofer.com/"
  company.bigsender = true
end

Company.find_or_create_by!(name: "PRQ Exteriors") do |company|
  company.website = "https://prqexteriors.com/"
  company.bigsender = true
end

Company.find_or_create_by!(name: "Matheson Heating") do |company|
  company.website = "https://www.mathesonheating.com/"
  company.bigsender = true
end

# Little Senders
Company.find_or_create_by!(name: "Roble Tree Care") do |company|
  company.website = "https://www.robletreecare.com/"
  company.bigsender = false
end

Company.find_or_create_by!(name: "Palmer Shine") do |company|
  company.website = "https://www.palmershine.com/"
  company.bigsender = false
end

Company.find_or_create_by!(name: "Iron Mountain Plumbing") do |company|
  company.website = "https://www.ironmountainplumbing.com/"
  company.bigsender = false
end

puts "Seeding complete."
