#include <iostream>
using namespace std;

int main() {
    int n = 100;
    int count = 0;

    for (int i = 1; i <= n; i *= 2) {
        cout << i << " ";
        count++;
    }
    cout << endl;

    cout << "N = " << n << ", loop ran " << count << " times" << endl;
    cout << "i doubles each time, so TC = O(log N)" << endl;
    return 0;
}
