import requests
import sys
import json
from datetime import datetime

class CyberSecAPITester:
    def __init__(self, base_url="https://cybersec-missions.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            self.passed_tests.append(test_name)
            print(f"✅ {test_name} - PASSED")
        else:
            self.failed_tests.append({"test": test_name, "details": details})
            print(f"❌ {test_name} - FAILED: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_result(name, True)
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_result(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_result(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_auth_register(self):
        """Test user registration"""
        test_user_data = {
            "email": f"test_{datetime.now().strftime('%H%M%S')}@theadmins.com",
            "password": "Test@123",
            "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
            "role": "soldado"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_auth_login(self):
        """Test login with test admin user"""
        login_data = {
            "email": "test@theadmins.com",
            "password": "Test@123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_stats(self):
        """Test stats endpoint"""
        success, response = self.run_test(
            "Get Stats",
            "GET",
            "stats",
            200
        )
        return success

    def test_create_mission(self):
        """Test mission creation"""
        mission_data = {
            "title": "Test Mission - Phishing Site",
            "description": "Test mission for automated testing",
            "target_url": "https://example-phishing-site.com",
            "category": "phishing",
            "priority": "high",
            "evidence": "Test evidence"
        }
        
        success, response = self.run_test(
            "Create Mission",
            "POST",
            "missions",
            200,
            data=mission_data
        )
        
        if success and 'id' in response:
            self.mission_id = response['id']
            return True
        return False

    def test_get_missions(self):
        """Test get missions"""
        success, response = self.run_test(
            "Get Missions",
            "GET",
            "missions",
            200
        )
        return success

    def test_accept_mission(self):
        """Test accept mission"""
        if hasattr(self, 'mission_id'):
            success, response = self.run_test(
                "Accept Mission",
                "POST",
                f"missions/{self.mission_id}/accept",
                200
            )
            return success
        return False

    def test_create_report(self):
        """Test report creation"""
        report_data = {
            "title": "Test Report - Suspicious Site",
            "description": "Test report for automated testing",
            "target_url": "https://suspicious-site.com",
            "category": "golpe",
            "evidence": "Test evidence for report"
        }
        
        success, response = self.run_test(
            "Create Report",
            "POST",
            "reports",
            200,
            data=report_data
        )
        
        if success and 'id' in response:
            self.report_id = response['id']
            return True
        return False

    def test_get_reports(self):
        """Test get reports"""
        success, response = self.run_test(
            "Get Reports",
            "GET",
            "reports",
            200
        )
        return success

    def test_accept_report(self):
        """Test accept report"""
        if hasattr(self, 'report_id'):
            success, response = self.run_test(
                "Accept Report",
                "POST",
                f"reports/{self.report_id}/accept",
                200
            )
            return success
        return False

    def test_chat_send_message(self):
        """Test send chat message"""
        message_data = {
            "content": "Test message from automated testing"
        }
        
        success, response = self.run_test(
            "Send Chat Message",
            "POST",
            "chat/send",
            200,
            data=message_data
        )
        return success

    def test_chat_get_messages(self):
        """Test get chat messages"""
        success, response = self.run_test(
            "Get Chat Messages",
            "GET",
            "chat/messages",
            200
        )
        return success

    def test_ai_chat(self):
        """Test AI chat functionality"""
        ai_message_data = {
            "content": "What is phishing?"
        }
        
        success, response = self.run_test(
            "AI Chat",
            "POST",
            "chat/ai",
            200,
            data=ai_message_data
        )
        return success

    def test_create_tool(self):
        """Test tool creation (admin only)"""
        tool_data = {
            "name": "Test Scanner Tool",
            "description": "Test tool for automated testing",
            "category": "scanner",
            "url": "https://example-tool.com",
            "is_file": False
        }
        
        success, response = self.run_test(
            "Create Tool",
            "POST",
            "tools",
            200,
            data=tool_data
        )
        
        if success and 'id' in response:
            self.tool_id = response['id']
            return True
        return False

    def test_get_tools(self):
        """Test get tools"""
        success, response = self.run_test(
            "Get Tools",
            "GET",
            "tools",
            200
        )
        return success

    def test_site_check(self):
        """Test site status check"""
        success, response = self.run_test(
            "Site Status Check",
            "POST",
            "site-check?url=https://google.com",
            200
        )
        return success

    def test_get_users(self):
        """Test get users (admin only)"""
        success, response = self.run_test(
            "Get Users",
            "GET",
            "users",
            200
        )
        return success

    def test_get_ranking(self):
        """Test get ranking"""
        success, response = self.run_test(
            "Get Ranking",
            "GET",
            "users/ranking",
            200
        )
        return success

def main():
    print("🚀 Starting The Admins Cybersecurity Platform API Tests")
    print("=" * 60)
    
    tester = CyberSecAPITester()
    
    # Test authentication first
    print("\n📋 AUTHENTICATION TESTS")
    print("-" * 30)
    
    # Try to login with test admin user first
    if not tester.test_auth_login():
        print("⚠️  Admin login failed, trying registration...")
        if not tester.test_auth_register():
            print("❌ Both login and registration failed, stopping tests")
            return 1
    
    tester.test_auth_me()
    
    # Test core functionality
    print("\n📋 CORE FUNCTIONALITY TESTS")
    print("-" * 30)
    
    tester.test_stats()
    tester.test_get_ranking()
    
    # Test missions
    print("\n📋 MISSION TESTS")
    print("-" * 30)
    
    tester.test_create_mission()
    tester.test_get_missions()
    tester.test_accept_mission()
    
    # Test reports
    print("\n📋 REPORT TESTS")
    print("-" * 30)
    
    tester.test_create_report()
    tester.test_get_reports()
    tester.test_accept_report()
    
    # Test chat
    print("\n📋 CHAT TESTS")
    print("-" * 30)
    
    tester.test_chat_send_message()
    tester.test_chat_get_messages()
    tester.test_ai_chat()
    
    # Test tools (admin only)
    print("\n📋 TOOLS TESTS")
    print("-" * 30)
    
    tester.test_create_tool()
    tester.test_get_tools()
    
    # Test admin functions
    print("\n📋 ADMIN TESTS")
    print("-" * 30)
    
    tester.test_get_users()
    tester.test_site_check()
    
    # Print final results
    print("\n" + "=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for failed in tester.failed_tests:
            print(f"   • {failed['test']}: {failed['details']}")
    
    if tester.passed_tests:
        print(f"\n✅ PASSED TESTS ({len(tester.passed_tests)}):")
        for passed in tester.passed_tests:
            print(f"   • {passed}")
    
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())