import React from 'react';

export default function Footer() {
  return (
    <footer className="px-4 sm:px-6 lg:px-8 py-6 text-xs text-gray-600">
      <div className="u-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="font-semibold text-gray-800 mb-2">NCS</div>
            <div className="text-gray-500">Fast, modern procurement platform.</div>
            <div className="mt-2 text-gray-500">© {new Date().getFullYear()} NCS</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800 mb-2">Navigate</div>
            <ul className="space-y-1 text-gray-500">
              {([
                ['Overview','/'],['Requests','/requests'],['Orders','/orders'],['Inventory','/inventory'],['Vendors','/vendors'],['Reports','/reports']
              ] as Array<[string,string]>).map(([label,href])=> (
                <li key={label}><a href={href} className="hover:text-gray-700">{label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-gray-800 mb-2">Workspace</div>
            <ul className="space-y-1 text-gray-500">
              {([
                ['Tasks','/tasks'],['Archive','/archive'],['Calendar','/calendar'],['Marketplace','/marketplace'],['Profile','/profile']
              ] as Array<[string,string]>).map(([label,href])=> (
                <li key={label}><a href={href} className="hover:text-gray-700">{label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-gray-800 mb-2">Resources</div>
            <ul className="space-y-1 text-gray-500">
              <li><a href="/templates/Inventory_Template.xlsx" className="hover:text-gray-700">Inventory Template</a></li>
              <li><a href="/templates/Vendors_Template.xlsx" className="hover:text-gray-700">Vendors Template</a></li>
              <li><a href="/templates/Purchase_Request_Template.xlsx" className="hover:text-gray-700">Requests Template</a></li>
              <li><a href="#" className="hover:text-gray-700">Support</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
