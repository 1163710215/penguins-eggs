clear
echo ">>> Re-install Eggs Saving Yolk"
tmp=`mktemp -d`
sudo mv /var/local/yolk $tmp
sudo apt purge eggs 
sudo dpkg -i /tmp/eggs*.deb
sudo mv $tmp/yolk /var/local
sudo eggs dad -d
