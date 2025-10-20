# Step 1: Use the official Nginx image
FROM nginx:alpine

# Step 2: Remove the default index.html provided by Nginx
RUN rm /usr/share/nginx/html/*

# Step 3: Copy the React build files into the Nginx container
COPY ./build /usr/share/nginx/html

# Step 4: Copy a custom Nginx configuration file (optional)
COPY ./nginx.conf /etc/nginx/nginx.conf

# Step 5: Expose the port that Nginx will serve on
EXPOSE 80

# Step 6: Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
